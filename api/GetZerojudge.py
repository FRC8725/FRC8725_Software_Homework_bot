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
    info_text = info_text.replace(r"\cdots", "…")
    info_text = info_text.replace(r"\le", "≤")

    # Get input
    input_info_parser = soup.find("div", class_="problembox", id="problem_theinput").getText(strip=True)
    input_info_text = re.sub(r"\$(.*?)\$", r"`\1`", input_info_parser)
    input_info_text = input_info_text.replace(r"\le", "≤")

    # Get output
    output_parser = soup.find("div", class_="problembox", id="problem_theinput").getText(strip=True)
    output_info_text = re.sub(r"\$(.*?)\$", r"`\1`", output_parser)
    output_info_text = output_info_text.replace(r"\le", "≤")

    return jsonify({
        "id": pid,
        "title": title_text,
        "descript": info_text,
        "input": input_info_text,
        "output": output_info_text})

if __name__ == "__main__":
    app.run(port=5000, debug=False)