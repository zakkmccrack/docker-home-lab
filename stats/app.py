from flask import Flask, jsonify, render_template
from monitor.test import cpu
from monitor.test import ram
from monitor.test import disk
from monitor.test import temp
from monitor.test import kernel
from monitor.test import ufw_status

app = Flask(__name__)

@app.route("/stats/api/cpu")
def api_cpu():
    return jsonify(cpu())

@app.route("/stats/api/ram")
def api_ram():
    return jsonify(ram())

@app.route("/stats/api/temp")
def api_temp():
    return jsonify(temp())

@app.route("/stats/api/disk")
def api_disk():
    return jsonify(disk())

@app.route("/stats/api/kernel")
def api_kernel():
    return jsonify(kernel())

@app.route("/stats/api/ufw_status")
def api_ufw_status():
    return jsonify(ufw_status())

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5450)
