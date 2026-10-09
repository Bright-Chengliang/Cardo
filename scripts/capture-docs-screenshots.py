# scripts/capture-docs-screenshots.py
import asyncio
import os
import json
from playwright.async_api import async_playwright

async def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(project_root, "docs", "assets")
    os.makedirs(assets_dir, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Context (1920x1080)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = await context.new_page()

        # Fictional non-sensitive mock data
        mock_planning_session = {
            "id": "demo-ses-01",
            "goal": "Distributed Key-Value Engine: Raft Consensus Core Implementation",
            "tasks": [
                {"id": "t1", "title": "Draft AppendEntries RPC Protobuf Schema & State Transition Matrix", "estimatedMinutes": 25, "status": "pending"},
                {"id": "t2", "title": "Implement Leader Heartbeat & Randomized Election Timeout Loop", "estimatedMinutes": 30, "status": "pending"},
                {"id": "t3", "title": "Write Failure Injection Tests for Network Partition & Split-Brain Recovery", "estimatedMinutes": 20, "status": "pending"}
            ],
            "fallbackTask": "Review Raft Specification §5.2 on Log Invariants or organize architectural documentation.",
            "currentTaskId": None,
            "status": "planning",
            "createdAt": "2026-10-09T09:00:00.000Z"
        }

        mock_executing_session = {
            "id": "demo-ses-02",
            "goal": "High-Performance Vector Indexing Engine Optimization",
            "tasks": [
                {"id": "et1", "title": "Profile SIMD Dot-Product Kernel with AVX-512 Micro-benchmarks", "estimatedMinutes": 25, "status": "in_progress", "startedAt": "2026-10-09T09:12:00.000Z"},
                {"id": "et2", "title": "Refactor HNSW Graph Traversal Cache-Line Alignment", "estimatedMinutes": 35, "status": "pending"},
                {"id": "et3", "title": "Validate 1M Vector Recall@10 against Ground Truth Baseline", "estimatedMinutes": 20, "status": "pending"}
            ],
            "fallbackTask": "Re-read HNSW Paper Section 4 on entry-point search heuristics or clean up benchmark scripts.",
            "currentTaskId": "et1",
            "status": "executing",
            "startedAt": "2026-10-09T09:12:00.000Z",
            "createdAt": "2026-10-09T09:10:00.000Z"
        }

        mock_summaries = [
            {
                "sessionId": "demo-s-001",
                "goal": "High-Performance Vector Indexing Engine Optimization",
                "totalTasks": 4,
                "completedTasks": 4,
                "totalEstimatedMinutes": 90,
                "totalActualMinutes": 85,
                "accuracyRate": 0.88,
                "createdAt": "2026-10-08T10:00:00.000Z",
                "completedAt": "2026-10-08T11:25:00.000Z"
            },
            {
                "sessionId": "demo-s-002",
                "goal": "Distributed Cache Zero-Copy Protocol Serialization",
                "totalTasks": 3,
                "completedTasks": 3,
                "totalEstimatedMinutes": 75,
                "totalActualMinutes": 78,
                "accuracyRate": 0.92,
                "createdAt": "2026-10-07T14:30:00.000Z",
                "completedAt": "2026-10-07T15:48:00.000Z"
            },
            {
                "sessionId": "demo-s-003",
                "goal": "Kernel eBPF Tracepoint Packet Filter Pipeline",
                "totalTasks": 5,
                "completedTasks": 5,
                "totalEstimatedMinutes": 110,
                "totalActualMinutes": 125,
                "accuracyRate": 0.80,
                "createdAt": "2026-10-06T09:15:00.000Z",
                "completedAt": "2026-10-06T11:20:00.000Z"
            }
        ]

        # 1. Screenshot: Planning Page (Clean Form)
        await page.goto("http://localhost:3025")
        await page.evaluate("""() => {
            localStorage.clear();
        }""")
        await page.reload()
        await page.wait_for_selector("text=Plan Your Session")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(assets_dir, "cardo-planning.png"), full_page=False)
        print("Captured: cardo-planning.png")

        # 2. Screenshot: Execution View (Live Deep Work Channel)
        await page.evaluate(f"""() => {{
            localStorage.setItem('cardo_sessions', JSON.stringify([{json.dumps(mock_executing_session)}]));
            localStorage.setItem('cardo_current_session', 'demo-ses-02');
        }}""")
        # Also sync to backend server store so mobile and desktop match
        await page.goto("http://localhost:3025")
        await page.wait_for_selector("text=Active Task")
        await page.wait_for_timeout(1200)
        await page.screenshot(path=os.path.join(assets_dir, "cardo-execution.png"), full_page=False)
        print("Captured: cardo-execution.png")

        # 3. Screenshot: History & Calibration Page
        await page.evaluate(f"""() => {{
            localStorage.setItem('cardo_summaries', JSON.stringify({json.dumps(mock_summaries)}));
            localStorage.setItem('cardo_sessions', JSON.stringify([
                {json.dumps(mock_executing_session)},
                {{
                    "id": "demo-s-001",
                    "goal": "High-Performance Vector Indexing Engine Optimization",
                    "tasks": [
                        {{"id": "t1", "title": "SIMD Dot-Product Kernel", "estimatedMinutes": 25, "actualMinutes": 24, "status": "completed"}},
                        {{"id": "t2", "title": "HNSW Graph Cache Alignment", "estimatedMinutes": 35, "actualMinutes": 32, "status": "completed"}},
                        {{"id": "t3", "title": "Recall@10 Validation Suite", "estimatedMinutes": 20, "actualMinutes": 19, "status": "completed"}},
                        {{"id": "t4", "title": "Benchmark Latency Profile", "estimatedMinutes": 10, "actualMinutes": 10, "status": "completed"}}
                    ],
                    "status": "completed",
                    "createdAt": "2026-10-08T10:00:00.000Z",
                    "completedAt": "2026-10-08T11:25:00.000Z"
                }}
            ]));
        }}""")
        await page.goto("http://localhost:3025/history")
        await page.wait_for_selector("text=History & Calibration")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(assets_dir, "cardo-history.png"), full_page=False)
        print("Captured: cardo-history.png")

        # 4. Screenshot: Mobile View
        mobile_context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto("http://localhost:3025/mobile")
        await mobile_page.wait_for_timeout(1500)
        await mobile_page.screenshot(path=os.path.join(assets_dir, "cardo-mobile.png"), full_page=False)
        print("Captured: cardo-mobile.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
