#!/bin/bash

echo "⚠️  WARNING: This will rewrite Git history!"
echo "Make sure you have a backup and understand the implications."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "🧹 Cleaning Git history..."

# Files to remove from history
FILES_TO_REMOVE=(
    "dashboard-v3/debug-auth.html"
    "dashboard-v3/debug-jobber.html"
    "dashboard-v3/test-jobber-endpoint.html"
    "dashboard-v3/test-api-version.html"
)

# Remove files from all commits
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "Removing $file from history..."
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch $file" \
        --prune-empty --tag-name-filter cat -- --all
done

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "⚠️  IMPORTANT: You must force push to update the remote repository:"
echo "git push origin --force --all"
echo "git push origin --force --tags"
echo ""
echo "⚠️  WARNING: This will rewrite history for all collaborators!"