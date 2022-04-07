import subprocess
path = "gs://insights-temp/question-"
files = subprocess.check_output("gsutil ls " + path + "*.json",shell=True)
files = files.decode().split("\n")[:-1]
for f in files:
    subprocess.call("gsutil mv %s %s"%(f,f[:-4]+"txt"),shell=True)
