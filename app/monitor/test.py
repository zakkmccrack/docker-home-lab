import psutil
import subprocess

def cpu():
    return psutil.cpu_percent(interval=1)

def ram():
    return {"virtual_memory_percent":psutil.virtual_memory().percent}

def disk():
    return psutil.disk_usage('/').percent

def temp():
    return float((subprocess.check_output(["vcgencmd", "measure_temp"])).decode().split('=')[1].replace("'C\n", ""))

def kernel():
    return (subprocess.check_output(["journalctl","-xe"])).decode()

def ufw_status():
    return (subprocess.check_output(["ufw", "status"])).decode()


def stats():
    return{
        "cpu": cpu(),
        "ram": ram(),
        "disk": disk(),
        "temp": temp(),
    }