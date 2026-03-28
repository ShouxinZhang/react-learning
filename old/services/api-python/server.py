"""
API 路由层 - 负责 HTTP 中转
"""
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from logic import calc_sum

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "service": "calculator-api"})

@app.route('/calculate', methods=['POST'])
def api_calculate():
    data = request.json
    n_str = data.get('n', '0')
    print(f"[Backend] Received calculation request for n={n_str}")
    try:
        n = int(n_str)
        result = calc_sum(n)
        return jsonify({"n": n, "sum": str(result)})
    except Exception as e:
        print(f"[Backend] Calculation error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", "5000"))
    app.run(port=port)
