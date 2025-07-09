#!/usr/bin/env python3
"""
GitHub Integration with Claude SDK
This example shows how to use Claude to analyze GitHub repositories
"""
import os
import subprocess
import json
from anthropic import Anthropic

def get_github_info(repo_url):
    """Extract owner and repo name from GitHub URL"""
    # Handle different URL formats
    if repo_url.startswith("https://github.com/"):
        parts = repo_url.replace("https://github.com/", "").rstrip("/").split("/")
    elif repo_url.startswith("git@github.com:"):
        parts = repo_url.replace("git@github.com:", "").replace(".git", "").split("/")
    else:
        parts = repo_url.split("/")
    
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None, None

def analyze_repository(client, repo_url):
    """Use Claude to analyze a GitHub repository"""
    owner, repo = get_github_info(repo_url)
    if not owner or not repo:
        print(f"Invalid repository URL: {repo_url}")
        return
    
    # Use gh CLI to get repository information
    try:
        # Get repository details
        repo_info = subprocess.run(
            ["gh", "api", f"repos/{owner}/{repo}"],
            capture_output=True,
            text=True,
            check=True
        )
        repo_data = json.loads(repo_info.stdout)
        
        # Get recent commits
        commits = subprocess.run(
            ["gh", "api", f"repos/{owner}/{repo}/commits", "--paginate", "-X", "GET", "-F", "per_page=10"],
            capture_output=True,
            text=True,
            check=True
        )
        commits_data = json.loads(commits.stdout)
        
        # Get languages
        languages = subprocess.run(
            ["gh", "api", f"repos/{owner}/{repo}/languages"],
            capture_output=True,
            text=True,
            check=True
        )
        languages_data = json.loads(languages.stdout)
        
    except subprocess.CalledProcessError as e:
        print(f"Error fetching repository data: {e}")
        return
    
    # Prepare context for Claude
    context = f"""
Repository: {repo_data['full_name']}
Description: {repo_data['description'] or 'No description'}
Stars: {repo_data['stargazers_count']}
Forks: {repo_data['forks_count']}
Primary Language: {repo_data['language'] or 'Not specified'}
All Languages: {', '.join(languages_data.keys())}
Created: {repo_data['created_at']}
Last Updated: {repo_data['updated_at']}

Recent Commits:
"""
    
    for i, commit in enumerate(commits_data[:5], 1):
        context += f"{i}. {commit['commit']['message'].split('\\n')[0]} by {commit['commit']['author']['name']}\n"
    
    # Ask Claude to analyze the repository
    prompt = f"""Based on this GitHub repository information, please provide:

1. A brief analysis of what this project does
2. The technology stack being used
3. How active the development is
4. Suggestions for potential improvements or contributions
5. Any notable patterns or practices observed

Repository Information:
{context}
"""
    
    print(f"Analyzing {repo_data['full_name']}...")
    print("=" * 60)
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        system="You are a software engineering expert who analyzes GitHub repositories to provide insights and recommendations.",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    return message.content[0].text

def create_pr_description(client, diff_content, branch_name):
    """Generate a PR description from git diff"""
    prompt = f"""Based on this git diff, create a comprehensive pull request description.

Branch: {branch_name}
Diff:
```
{diff_content[:3000]}  # Truncate if too long
```

Please provide:
1. PR Title (concise, descriptive)
2. Summary (2-3 sentences)
3. What changed (bullet points)
4. Why these changes were made
5. Testing performed
6. Any breaking changes or migration notes
"""
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        temperature=0.3,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    return message.content[0].text

def main():
    # Initialize Claude client
    client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    
    # Example 1: Analyze a repository
    print("Example 1: Repository Analysis")
    print("-" * 60)
    
    # You can analyze any public repository
    repo_url = "https://github.com/anthropics/anthropic-sdk-python"
    analysis = analyze_repository(client, repo_url)
    if analysis:
        print(analysis)
    
    print("\n\nExample 2: Generate PR Description")
    print("-" * 60)
    
    # Example diff (you can get real diff with: git diff main...feature-branch)
    sample_diff = """
diff --git a/src/utils/calculator.py b/src/utils/calculator.py
index abc123..def456 100644
--- a/src/utils/calculator.py
+++ b/src/utils/calculator.py
@@ -10,6 +10,15 @@ class Calculator:
     def multiply(self, a, b):
         return a * b
     
+    def divide(self, a, b):
+        if b == 0:
+            raise ValueError("Cannot divide by zero")
+        return a / b
+    
+    def power(self, base, exponent):
+        return base ** exponent
"""
    
    pr_description = create_pr_description(client, sample_diff, "feature/add-math-operations")
    print(pr_description)

if __name__ == "__main__":
    # Ensure GitHub CLI is authenticated
    try:
        subprocess.run(["gh", "auth", "status"], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("Error: GitHub CLI is not authenticated. Run 'gh auth login' first.")
        exit(1)
    
    main()