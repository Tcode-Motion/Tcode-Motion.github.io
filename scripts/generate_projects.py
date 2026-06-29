#!/usr/bin/env python3
"""
GitHub Project Portfolio Scraper.
Generates projects.json for Tcode-Motion portfolio website.
"""

import os
import sys
import time
import json
import logging
import random
import threading
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin
from typing import Dict, List, Any, Optional, Tuple

import requests
from bs4 import BeautifulSoup

# Configurable constants
GITHUB_OWNER = "Tcode-Motion"
CACHE_TTL_SECS = 21600  # 6 hours local API cache
DEFAULT_TIMEOUT = 10.0  # Configurable HTTP connection/read timeout (seconds)
EXCLUDE_FORKS = True
GENERATOR_VERSION = "1.0.0"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("portfolio_generator")

# Thread-local storage for requests session to keep connection pooling safe
thread_local = threading.local()

class ExecutionStats:
    """Class to keep track of scraper execution statistics."""
    def __init__(self):
        self.total_repos_scanned = 0
        self.hosted_websites_found = 0
        self.repos_skipped = 0
        self.api_requests_made = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.start_time = time.time()
        self.json_changed = False

    def get_summary(self) -> str:
        elapsed = time.time() - self.start_time
        return (
            "\n"
            "================ Scraper Execution Summary ================\n"
            f"Total Repositories Scanned : {self.total_repos_scanned}\n"
            f"Hosted Websites Found      : {self.hosted_websites_found}\n"
            f"Repositories Skipped       : {self.repos_skipped}\n"
            f"GitHub API Requests Made   : {self.api_requests_made}\n"
            f"Metadata Cache Hits        : {self.cache_hits}\n"
            f"Metadata Cache Misses      : {self.cache_misses}\n"
            f"Total Execution Time       : {elapsed:.2f} seconds\n"
            f"projects.json Changed      : {self.json_changed}\n"
            "==========================================================="
        )

# Global statistics object
stats = ExecutionStats()

def get_session() -> requests.Session:
    """Get or create a thread-local requests session with default headers."""
    if not hasattr(thread_local, "session"):
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        # Add GitHub authentication if token is available
        token = os.environ.get("GITHUB_TOKEN")
        if token:
            session.headers.update({
                "Accept": "application/vnd.github.v3+json",
                "Authorization": f"token {token}"
            })
        thread_local.session = session
    return thread_local.session

class LocalAPICache:
    """Handles file-based caching of GitHub API responses to prevent rate limits locally."""
    def __init__(self, cache_file: Path):
        self.cache_file = cache_file
        self.cache: Dict[str, Any] = {}
        self.load()

    def load(self):
        if self.cache_file.exists():
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    self.cache = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load local API cache: {e}")
                self.cache = {}

    def save(self):
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Could not save local API cache: {e}")

    def get(self, url: str) -> Optional[Any]:
        # Bypassed in GitHub Actions to ensure fresh runs
        if os.environ.get("GITHUB_ACTIONS") == "true":
            return None
        if url in self.cache:
            entry = self.cache[url]
            timestamp = entry.get("timestamp", 0)
            if time.time() - timestamp < CACHE_TTL_SECS:
                stats.cache_hits += 1
                return entry.get("data")
        return None

    def set(self, url: str, data: Any):
        self.cache[url] = {
            "timestamp": time.time(),
            "data": data
        }
        self.save()

# Global API cache instance
api_cache = LocalAPICache(Path(__file__).parent / ".api_cache.json")

def make_request(url: str, method: str = "GET", retries: int = 3, backoff: float = 2.0, use_api_cache: bool = False, **kwargs) -> requests.Response:
    """Makes HTTP request with rate limit handling, exponential backoff, and timeouts."""
    session = get_session()
    
    # Check cache first for API calls
    if use_api_cache and method.upper() == "GET":
        cached_data = api_cache.get(url)
        if cached_data is not None:
            # We mock a response object for the cached JSON
            response = requests.Response()
            response.status_code = 200
            response._content = json.dumps(cached_data).encode("utf-8")
            response.headers["Content-Type"] = "application/json"
            return response
    
    # Ensure timeout is always set
    kwargs.setdefault("timeout", DEFAULT_TIMEOUT)
    
    for attempt in range(retries):
        try:
            if use_api_cache:
                stats.api_requests_made += 1
            
            if method.upper() == "HEAD":
                response = session.head(url, **kwargs)
            else:
                response = session.get(url, **kwargs)

            # Check for GitHub API Rate Limit remaining header
            limit_remaining = response.headers.get("X-RateLimit-Remaining")
            limit_reset = response.headers.get("X-RateLimit-Reset")
            if limit_remaining is not None and int(limit_remaining) == 0:
                if limit_reset:
                    sleep_time = max(1, int(limit_reset) - int(time.time()))
                    logger.warning(f"GitHub API Rate Limit hit. Sleeping for {sleep_time}s")
                    time.sleep(sleep_time)
                    continue

            # Exponential backoff on rate-limited response (403 / 429) or Server Errors (5xx)
            if response.status_code in [403, 429]:
                # If it's a rate limit reset issue
                if limit_reset:
                    sleep_time = max(1, int(limit_reset) - int(time.time()))
                    logger.warning(f"Status {response.status_code} (Rate Limit). Sleeping for {sleep_time}s")
                    time.sleep(sleep_time)
                    continue
                else:
                    sleep_time = (backoff ** attempt) + random.uniform(0, 1.0)
                    logger.warning(f"Status {response.status_code}. Retrying in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    continue
            
            if response.status_code >= 500:
                sleep_time = (backoff ** attempt) + random.uniform(0, 1.0)
                logger.warning(f"Server Error {response.status_code}. Retrying in {sleep_time:.2f}s...")
                time.sleep(sleep_time)
                continue

            # If successful API call, update cache
            if use_api_cache and response.status_code == 200:
                try:
                    api_cache.set(url, response.json())
                except Exception:
                    pass
            
            return response

        except requests.exceptions.RequestException as e:
            sleep_time = (backoff ** attempt) + random.uniform(0, 1.0)
            logger.warning(f"Request failed ({url}): {e}. Retrying in {sleep_time:.2f}s...")
            time.sleep(sleep_time)
            if attempt == retries - 1:
                raise e

    # Return the last response even if not 200
    return response

def check_url_exists(url: str) -> bool:
    """Verifies if a URL is active and returns 200 OK using HEAD and GET fallbacks."""
    try:
        # Try HEAD request first (fast, minimal bytes)
        r = make_request(url, method="HEAD", retries=2)
        if r.status_code == 200:
            return True
        if r.status_code in [404, 410]:
            return False
            
        # Try GET request with streaming if HEAD was blocked or returned 405/403
        r = make_request(url, method="GET", stream=True, retries=2)
        return r.status_code == 200
    except Exception:
        return False

def check_pages_deployment_status(repo_name: str) -> Tuple[bool, Optional[str]]:
    """
    Checks the GitHub deployments API for pages environment.
    Returns (deployment_found, latest_status_state).
    """
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{repo_name}/deployments"
    try:
        response = make_request(url, use_api_cache=True)
        if response.status_code != 200:
            return False, None
            
        deployments = response.json()
        pages_deploys = [d for d in deployments if d.get("environment") == "github-pages"]
        if not pages_deploys:
            return False, None
            
        # Inspect statuses of the latest deployment
        latest_deploy = pages_deploys[0]
        statuses_url = latest_deploy.get("statuses_url")
        if not statuses_url:
            return True, None
            
        status_resp = make_request(statuses_url, use_api_cache=True)
        if status_resp.status_code == 200:
            statuses = status_resp.json()
            if statuses:
                return True, statuses[0].get("state")
        return True, None
    except Exception as e:
        logger.warning(f"Error fetching Pages deployment status for {repo_name}: {e}")
        return False, None

def validate_and_detect_website(repo: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates hosting status of the repository.
    Returns (is_hosted, validated_url, deployment_status).
    """
    repo_name = repo["name"]
    homepage = repo.get("homepage")
    
    # 1. Determine the candidate URLs in order
    candidates = []
    if homepage:
        homepage = homepage.strip()
        if not homepage.startswith(("http://", "https://")):
            homepage = "https://" + homepage
        candidates.append(homepage)
        
    constructed_url = f"https://{GITHUB_OWNER.lower()}.github.io/{repo_name}/"
    cname_constructed_url = f"https://techscript.is-a.dev/{repo_name}/"
    
    candidates.append(cname_constructed_url)
    candidates.append(constructed_url)

    # 2. Check deployment status if possible
    deploy_found, deploy_state = check_pages_deployment_status(repo_name)
    if deploy_found:
        logger.info(f"[{repo_name}] Pages deployment state found: {deploy_state}")
        if deploy_state == "success":
            # If deployment succeeded, still run check on the URLs to confirm active
            for url in candidates:
                if check_url_exists(url):
                    return True, url, "success"
        elif deploy_state in ["pending", "queued", "in_progress"]:
            logger.info(f"[{repo_name}] Deployment is active/pending. Waiting for deployment...")
            # Try validating the URL with retries and exponential backoff
            for url in candidates:
                if validate_live_url_with_retry(url):
                    return True, url, deploy_state
            return False, None, deploy_state
        elif deploy_state == "failure":
            logger.warning(f"[{repo_name}] Pages deployment status is failure. Skipping repo.")
            return False, None, "failure"

    # 3. Fallback: If no deployment details, validate candidates directly
    for url in candidates:
        if validate_live_url_with_retry(url):
            return True, url, deploy_state or "unknown"

    return False, None, deploy_state

def validate_live_url_with_retry(url: str, retries: int = 3, backoff: float = 2.0) -> bool:
    """Validate a URL with at least 3 attempts of exponential backoff to handle temp 404/503s."""
    for attempt in range(retries):
        try:
            r = make_request(url, method="GET", stream=True)
            if r.status_code == 200:
                return True
            logger.warning(f"URL {url} returned status {r.status_code} (attempt {attempt+1}/{retries})")
        except Exception as e:
            logger.warning(f"URL {url} validation error: {e} (attempt {attempt+1}/{retries})")
            
        if attempt < retries - 1:
            sleep_time = (backoff ** attempt) + random.uniform(0, 1.0)
            time.sleep(sleep_time)
    return False

def parse_html_metadata(url: str) -> Dict[str, str]:
    """Downloads the HTML and extracts title, description, og tags, favicon, and theme-color."""
    meta = {
        "html_title": "",
        "html_description": "",
        "og_title": "",
        "og_description": "",
        "og_image": "",
        "favicon": "",
        "theme_color": ""
    }
    
    try:
        r = make_request(url, method="GET")
        if r.status_code != 200:
            return meta
            
        soup = BeautifulSoup(r.content, "html.parser")
        
        # 1. HTML Title
        if soup.title and soup.title.string:
            meta["html_title"] = soup.title.string.strip()
            
        # 2. HTML Meta Description
        desc_tag = soup.find("meta", attrs={"name": "description"})
        if desc_tag and desc_tag.get("content"):
            meta["html_description"] = desc_tag.get("content").strip()
            
        # 3. OpenGraph Title
        ogt = soup.find("meta", attrs={"property": "og:title"})
        if ogt and ogt.get("content"):
            meta["og_title"] = ogt.get("content").strip()
            
        # 4. OpenGraph Description
        ogd = soup.find("meta", attrs={"property": "og:description"})
        if ogd and ogd.get("content"):
            meta["og_description"] = ogd.get("content").strip()
            
        # 5. OpenGraph Image
        ogi = soup.find("meta", attrs={"property": "og:image"})
        if ogi and ogi.get("content"):
            meta["og_image"] = urljoin(url, ogi.get("content").strip())
            
        # 6. Favicon
        fav_tag = soup.find("link", rel=lambda x: x and "icon" in x.lower())
        if fav_tag and fav_tag.get("href"):
            meta["favicon"] = urljoin(url, fav_tag.get("href").strip())
        else:
            # Check default path
            default_favicon = urljoin(url, "favicon.ico")
            meta["favicon"] = default_favicon
            
        # 7. Theme color
        tc_tag = soup.find("meta", attrs={"name": "theme-color"})
        if tc_tag and tc_tag.get("content"):
            meta["theme_color"] = tc_tag.get("content").strip()
            
    except Exception as e:
        logger.warning(f"Error parsing metadata for {url}: {e}")
        
    return meta

def select_preview_image(url: str, repo_name: str, meta: Dict[str, str]) -> str:
    """Finds first valid preview image following the strict fallback chain."""
    # 1. og:image
    if meta.get("og_image") and check_url_exists(meta["og_image"]):
        return meta["og_image"]
        
    # 2. Repo-name based images (e.g. NovOS.png, NovOS.webp, novos.png)
    repo_img_candidates = [
        f"{repo_name}.png", f"{repo_name}.webp", f"{repo_name}.jpg", f"{repo_name}.jpeg",
        f"{repo_name.lower()}.png", f"{repo_name.lower()}.webp", f"{repo_name.lower()}.jpg", f"{repo_name.lower()}.jpeg"
    ]
    for cand in repo_img_candidates:
        cand_url = urljoin(url, cand)
        if check_url_exists(cand_url):
            return cand_url
            
    # 3. Standard high-res banner and cover candidates
    candidates = [
        "banner.webp", "banner.png", "banner.jpg", "banner.jpeg",
        "cover.webp", "cover.png", "cover.jpg", "cover.jpeg",
        "preview.webp", "preview.png", "preview.jpg", "preview.jpeg",
        "thumbnail.webp", "thumbnail.png", "thumbnail.jpg", "thumbnail.jpeg",
        "logo.webp", "logo.png", "logo.jpg", "logo.jpeg"
    ]
    for cand in candidates:
        cand_url = urljoin(url, cand)
        if check_url_exists(cand_url):
            return cand_url
            
    # 4. GitHub OpenGraph Image (high resolution 1200x600 social preview)
    github_og_url = f"https://opengraph.githubassets.com/1/{GITHUB_OWNER}/{repo_name}"
    if check_url_exists(github_og_url):
        return github_og_url
        
    # 5. Icon/Favicon as a final low-quality fallback if everything else fails
    icon_candidates = ["icon.png", "icon.webp", "icon.jpg", "icon.jpeg"]
    for cand in icon_candidates:
        cand_url = urljoin(url, cand)
        if check_url_exists(cand_url):
            return cand_url
            
    if meta.get("favicon") and check_url_exists(meta["favicon"]):
        return meta["favicon"]
        
    return github_og_url

def load_existing_projects(json_path: Path) -> Dict[str, Dict[str, Any]]:
    """Loads existing projects.json to support incremental caching."""
    if not json_path.exists():
        return {}
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            projects_list = data.get("projects", [])
            return {p["name"]: p for p in projects_list if "name" in p}
    except Exception as e:
        logger.warning(f"Could not load existing projects.json for incremental cache: {e}")
        return {}

def format_date(date_str: Optional[str]) -> str:
    """Formats ISO-8601 timestamp string into YYYY-MM-DD format."""
    if not date_str:
        return ""
    try:
        # GitHub dates are in format 2026-06-29T10:51:44Z
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return date_str[:10]

def process_repository(repo: Dict[str, Any], cache: Dict[str, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Processes a single repository and returns a structured dictionary of project data.
    Implements fault tolerance.
    """
    repo_name = repo["name"]
    stats.total_repos_scanned += 1
    
    # 1. Apply Exclusion Rules
    # - Private, Archived, Disabled
    if repo.get("private") or repo.get("archived") or repo.get("disabled"):
        logger.info(f"[{repo_name}] Skipping: private/archived/disabled.")
        stats.repos_skipped += 1
        return None
        
    # - Forks
    if EXCLUDE_FORKS and repo.get("fork"):
        logger.info(f"[{repo_name}] Skipping: fork.")
        stats.repos_skipped += 1
        return None
        
    # - Template repositories
    if repo.get("is_template"):
        logger.info(f"[{repo_name}] Skipping: template repo.")
        stats.repos_skipped += 1
        return None
        
    # - Dot-prefixed repositories
    if repo_name.startswith("."):
        logger.info(f"[{repo_name}] Skipping: dot-prefixed name.")
        stats.repos_skipped += 1
        return None
        
    # - Empty repositories (size == 0 or missing pushed_at)
    if repo.get("size") == 0 or not repo.get("pushed_at"):
        logger.info(f"[{repo_name}] Skipping: empty repository.")
        stats.repos_skipped += 1
        return None
        
    # - Tcode-Motion.github.io itself
    if repo_name.lower() == f"{GITHUB_OWNER.lower()}.github.io":
        logger.info(f"[{repo_name}] Skipping: GitHub Pages root portfolio repository itself.")
        stats.repos_skipped += 1
        return None

    try:
        # 2. Hosted Website Check and Validation
        is_hosted, live_url, deploy_status = validate_and_detect_website(repo)
        if not is_hosted or not live_url:
            logger.info(f"[{repo_name}] Skipping: no live hosted website detected.")
            stats.repos_skipped += 1
            return None
            
        logger.info(f"[{repo_name}] Hosted website confirmed at: {live_url}")
        
        # 3. Incremental Caching Check
        pushed_date = format_date(repo.get("pushed_at"))
        cached_project = cache.get(repo_name)
        
        scraped_meta = {}
        preview_image = ""
        
        # If pushed date is identical, reuse previously scraped metadata
        if cached_project and cached_project.get("pushed") == pushed_date and cached_project.get("hosted"):
            logger.info(f"[{repo_name}] Incremental Cache Hit! Reusing scraped metadata.")
            stats.cache_hits += 1
            
            scraped_meta = {
                "html_title": cached_project.get("html_title", ""),
                "html_description": cached_project.get("html_description", ""),
                "og_title": cached_project.get("og_title", ""),
                "og_description": cached_project.get("og_description", ""),
                "og_image": cached_project.get("og_image", ""),
                "favicon": cached_project.get("favicon", ""),
                "theme_color": cached_project.get("theme_color", "")
            }
            preview_image = cached_project.get("preview_image", "")
            display_title = cached_project.get("display_title", repo_name)
            
        else:
            logger.info(f"[{repo_name}] Cache Miss or Repository Updated. Scraping metadata...")
            stats.cache_misses += 1
            
            # Scrape HTML metadata
            scraped_meta = parse_html_metadata(live_url)
            
            # Select preview image based on fallback hierarchy
            preview_image = select_preview_image(live_url, repo_name, scraped_meta)
            
            # Form display title (HTML title, og:title, or repo name fallback)
            display_title = scraped_meta.get("html_title") or scraped_meta.get("og_title") or repo_name
            # If title is extremely long or generic, default to name
            if len(display_title) > 60:
                display_title = repo_name

        # 4. Map the required fields (API + Scraped Metadata)
        project = {
            "name": repo_name,
            "display_title": display_title,
            "description": repo.get("description") or scraped_meta.get("html_description") or scraped_meta.get("og_description") or "",
            "repo": repo.get("html_url", ""),
            "website": live_url,
            "homepage_url": repo.get("homepage") or "",
            "hosted": True,
            "language": repo.get("language") or "HTML",
            "topics": repo.get("topics") or [],
            "license": repo.get("license", {}).get("spdx_id") or repo.get("license", {}).get("name") if repo.get("license") else "",
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "watchers": repo.get("watchers_count", 0),
            "open_issues": repo.get("open_issues_count", 0),
            "size": repo.get("size", 0),
            "default_branch": repo.get("default_branch", "main"),
            "created": format_date(repo.get("created_at")),
            "updated": format_date(repo.get("updated_at")),
            "pushed": pushed_date,
            "owner": repo.get("owner", {}).get("login") or GITHUB_OWNER,
            "avatar_url": repo.get("owner", {}).get("avatar_url") or "",
            "preview_image": preview_image,
            "favicon": scraped_meta.get("favicon", ""),
            "theme_color": scraped_meta.get("theme_color", ""),
            "html_title": scraped_meta.get("html_title", ""),
            "html_description": scraped_meta.get("html_description", ""),
            "og_title": scraped_meta.get("og_title", ""),
            "og_description": scraped_meta.get("og_description", ""),
            "og_image": scraped_meta.get("og_image", "")
        }
        
        stats.hosted_websites_found += 1
        return project

    except Exception as e:
        logger.error(f"[{repo_name}] Fault Tolerance Alert: Failed to process repository. Error: {e}", exc_info=True)
        stats.repos_skipped += 1
        return None

def fetch_all_github_repos() -> List[Dict[str, Any]]:
    """Queries the GitHub API and fetches all public repos, handling pagination correctly."""
    repos = []
    page = 1
    
    while True:
        url = f"https://api.github.com/users/{GITHUB_OWNER}/repos?per_page=100&page={page}"
        logger.info(f"Fetching GitHub repos - Page {page}...")
        try:
            response = make_request(url, use_api_cache=True)
            if response.status_code != 200:
                logger.error(f"Failed to fetch repositories: {response.status_code} - {response.text}")
                break
                
            page_repos = response.json()
            if not page_repos:
                break
                
            repos.extend(page_repos)
            if len(page_repos) < 100:
                break
            page += 1
        except Exception as e:
            logger.error(f"Failed to fetch page {page}: {e}")
            break
            
    return repos

def main():
    root_path = Path(__file__).parent.parent
    json_path = root_path / "projects.json"
    
    # 1. Load existing projects from projects.json for incremental cache
    logger.info(f"Loading incremental cache from {json_path}...")
    existing_cache = load_existing_projects(json_path)
    logger.info(f"Loaded {len(existing_cache)} projects from cache.")

    # 2. Fetch all public repositories
    logger.info("Connecting to GitHub REST API...")
    repos = fetch_all_github_repos()
    logger.info(f"Fetched {len(repos)} repositories from GitHub API.")

    # 3. Process repositories sequentially (keep sequential to be gentle on server and preserve logging flow)
    projects = []
    for repo in repos:
        project = process_repository(repo, existing_cache)
        if project:
            projects.append(project)

    # 4. Deterministic Sorting: sort by updated date descending, then name ascending (stable sort)
    # First sort alphabetically by name (case-insensitive)
    projects.sort(key=lambda x: x["name"].lower())
    # Then sort by updated date descending
    projects.sort(key=lambda x: x["updated"], reverse=True)

    # 5. Check if projects array is different from the cached projects to prevent redundant commits
    new_projects_keys = [p["name"] for p in projects]
    old_projects_keys = list(existing_cache.keys())
    
    # Simple deep comparison check on project data
    content_changed = False
    if len(projects) != len(existing_cache):
        content_changed = True
    else:
        for p in projects:
            old_p = existing_cache.get(p["name"])
            if not old_p:
                content_changed = True
                break
            # Compare key attributes that would affect frontend showcase
            # We omit metadata generated dates but check metrics and details
            comp_keys = [
                "display_title", "description", "website", "language", 
                "topics", "stars", "forks", "preview_image", "favicon", "pushed"
            ]
            for key in comp_keys:
                if p.get(key) != old_p.get(key):
                    content_changed = True
                    break
            if content_changed:
                break

    # 6. Save JSON if changed (or force write if projects.json doesn't exist)
    if content_changed or not json_path.exists():
        stats.json_changed = True
        output_data = {
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "generatorVersion": GENERATOR_VERSION,
            "totalProjects": len(projects),
            "projects": projects
        }
        
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Successfully generated new projects.json with {len(projects)} projects.")
        except Exception as e:
            logger.error(f"Could not write projects.json: {e}")
    else:
        logger.info("No content changes detected in projects list. Skipping projects.json rewrite.")

    # 7. Print summary statistics
    logger.info(stats.get_summary())

if __name__ == "__main__":
    main()
