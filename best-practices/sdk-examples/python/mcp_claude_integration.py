#!/usr/bin/env python3
"""
MCP + Claude SDK Integration Example
Shows how to combine MCP services with Claude's capabilities
"""
import os
import sqlite3
import json
from datetime import datetime
from anthropic import Anthropic

class IntelligentMCPAssistant:
    def __init__(self, db_path="~/.config/claude/databases/assistant.db"):
        self.client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.db_path = os.path.expanduser(db_path)
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for storing interactions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                query TEXT,
                response TEXT,
                context TEXT,
                tokens_used INTEGER
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS code_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT,
                issues TEXT,
                suggestions TEXT,
                score INTEGER
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def analyze_file_with_context(self, file_path):
        """Read file using MCP filesystem and analyze with Claude"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            prompt = f"""Analyze this code file and provide:
1. Summary of functionality
2. Code quality assessment (1-10)
3. Potential issues or bugs
4. Improvement suggestions
5. Security considerations

File: {file_path}
Content:
```
{content}
```
"""
            
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                system="You are an expert code reviewer. Provide constructive, actionable feedback.",
                messages=[{"role": "user", "content": prompt}]
            )
            
            response = message.content[0].text
            
            # Store in database
            self.store_code_review(file_path, response)
            
            return response
            
        except Exception as e:
            return f"Error analyzing file: {str(e)}"
    
    def store_code_review(self, file_path, analysis):
        """Store code review results in SQLite"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Parse the analysis to extract structured data
        # In a real implementation, you'd parse this more carefully
        cursor.execute('''
            INSERT INTO code_reviews (file_path, issues, suggestions, score)
            VALUES (?, ?, ?, ?)
        ''', (file_path, analysis, "", 0))
        
        conn.commit()
        conn.close()
    
    def get_historical_insights(self, query):
        """Use past interactions to provide better responses"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get recent related interactions
        cursor.execute('''
            SELECT query, response FROM interactions
            WHERE query LIKE ?
            ORDER BY timestamp DESC
            LIMIT 5
        ''', (f'%{query}%',))
        
        history = cursor.fetchall()
        conn.close()
        
        context = "Previous related queries:\n"
        for past_query, past_response in history:
            context += f"Q: {past_query[:100]}...\n"
            context += f"A: {past_response[:200]}...\n\n"
        
        return context if history else ""
    
    def intelligent_query(self, query, use_history=True):
        """Process a query with optional historical context"""
        context = ""
        if use_history:
            context = self.get_historical_insights(query)
        
        prompt = query
        if context:
            prompt = f"Context from previous interactions:\n{context}\n\nCurrent query: {query}"
        
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response = message.content[0].text
        
        # Store interaction
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO interactions (query, response, context, tokens_used)
            VALUES (?, ?, ?, ?)
        ''', (query, response, context, len(prompt.split()) + len(response.split())))
        conn.commit()
        conn.close()
        
        return response
    
    def generate_daily_summary(self):
        """Generate a summary of today's activities"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get today's data
        cursor.execute('''
            SELECT COUNT(*), SUM(tokens_used) FROM interactions
            WHERE DATE(timestamp) = DATE('now')
        ''')
        interactions_count, total_tokens = cursor.fetchone()
        
        cursor.execute('''
            SELECT COUNT(*), AVG(score) FROM code_reviews
            WHERE DATE(timestamp) = DATE('now')
        ''')
        reviews_count, avg_score = cursor.fetchone()
        
        cursor.execute('''
            SELECT query FROM interactions
            WHERE DATE(timestamp) = DATE('now')
            ORDER BY timestamp DESC
            LIMIT 10
        ''')
        recent_queries = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        summary_data = f"""
Today's Activity Summary:
- Total interactions: {interactions_count or 0}
- Tokens used: {total_tokens or 0}
- Code reviews: {reviews_count or 0}
- Average code score: {avg_score or 'N/A'}

Recent queries:
{chr(10).join(f"- {q[:80]}..." for q in recent_queries[:5])}
"""
        
        # Use Claude to create an insightful summary
        prompt = f"""Based on this activity data, create a brief but insightful summary that includes:
1. Key accomplishments
2. Patterns in the queries
3. Suggestions for tomorrow
4. Estimated productivity impact

Data:
{summary_data}
"""
        
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return message.content[0].text

def main():
    assistant = IntelligentMCPAssistant()
    
    print("MCP + Claude Integration Examples")
    print("=" * 60)
    
    # Example 1: Analyze a file
    print("\n1. Analyzing a code file:")
    print("-" * 40)
    # Analyze this script itself
    analysis = assistant.analyze_file_with_context(__file__)
    print(analysis[:500] + "..." if len(analysis) > 500 else analysis)
    
    # Example 2: Intelligent query with history
    print("\n\n2. Intelligent Query:")
    print("-" * 40)
    response = assistant.intelligent_query(
        "What are best practices for Python error handling?"
    )
    print(response)
    
    # Example 3: Generate summary
    print("\n\n3. Daily Summary:")
    print("-" * 40)
    summary = assistant.generate_daily_summary()
    print(summary)
    
    # Show database stats
    conn = sqlite3.connect(assistant.db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM interactions")
    count = cursor.fetchone()[0]
    conn.close()
    
    print(f"\n\nTotal interactions stored: {count}")
    print(f"Database location: {assistant.db_path}")

if __name__ == "__main__":
    main()