from flask import Flask, jsonify
import requests
import re
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route("/problem/<pid>")
def get_problem_info(pid):
    url = f"https://zerojudge.tw/ShowProblem?problemid={pid}"
    res = requests.get(url)
    res.encoding = 'utf-8'

    soup = BeautifulSoup(res.text, "html.parser")

    # Get title
    title_parser = soup.find("div", class_="h1")
    title_text = title_parser.find("span", id="problem_title").getText(strip=True)
    
    # Get info
    info_parser = soup.find("div", class_="problembox", id="problem_content").getText(strip=True)
    info_text = re.sub(r"\$(.*?)\$", r"`\1`", info_parser)

    # Get input
    input_parser = soup.find("div", class_="problembox", id="problem_theinput").getText(strip=True)
    input_text = re.sub(r"\$(.*?)\$", r"`\1`", input_parser)

    # Get output
    output_parser = soup.find("div", class_="problembox", id="problem_theinput").getText(strip=True)
    output_text = re.sub(r"\$(.*?)\$", r"`\1`", output_parser)

    return jsonify({
        "id": pid,
        "title": title_text,
        "descript": info_text,
        "input": input_text,
        "output": output_text})

if __name__ == "__main__":
    app.run(port=5000, debug=True)