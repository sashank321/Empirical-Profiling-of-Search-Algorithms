import urllib.request
import json

def test_endpoint(path, data):
    req = urllib.request.Request(f'http://127.0.0.1:5000{path}', data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        res = urllib.request.urlopen(req)
        # Just check status and if it parses
        body = json.loads(res.read())
        print(f"SUCCESS: {path} with {data.get('algorithm') or data.get('problem') or 'decision'}")
    except Exception as e:
        print(f"FAILED: {path} with {data.get('algorithm') or data.get('problem') or 'decision'} - {e}")

print("Verifying Search Algorithms...")
for algo in ['bfs', 'dfs', 'ucs', 'gbfs', 'astar', 'dijkstra', 'iddfs', 'idaStar']:
    test_endpoint('/api/search/execute', {
        'algorithm': algo,
        'start': 'A', 'goal': 'C',
        'adjacency': {'A': {'B': 1, 'C': 2}, 'B': {'C': 1}, 'C': {}},
        'heuristic': {'A': 2, 'B': 1, 'C': 0}
    })

print("\nVerifying CSP Algorithms...")
for prob in ['n_queens', 'graph_coloring', 'timetabling', 'cryptarithmetic']:
    test_endpoint('/api/csp/execute', {
        'problem': prob,
        'algorithm': 'backtracking'
    })

print("\nVerifying Decision Algorithms...")
for is_alpha_beta in [False, True]:
    test_endpoint('/api/decision/execute', {
        'problem': 'tic_tac_toe',
        'board': [None]*9,
        'useAlphaBeta': is_alpha_beta
    })

print("\nVerifying Uncertainty Algorithms...")
for prob in ['medical', 'weather']:
    test_endpoint('/api/uncertainty/execute', {
        'problem': prob,
        'evidence': {}
    })
