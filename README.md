

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <h3 align="center">Gravitas Scraper</h3>

  <p align="center">
    A project to efficiently scrape event seat data from the Gravitas website without causing any effect on their servers
    <br />
    <br />
    <br />
  </p>
</p>

---

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
  </ol>
</details>

---

## About

The scraper fetches real-time seat availability data for events hosted on the gravitas.vit.ac.in website. This project is built using Puppeteer and Node.js to scrape the data and display it on a local web server. The project is deployed on https://cryptichunt.in via Heroku. It is designed to be as unintrusive and efficient as possible. 

---

### Built With

* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [Puppeteer](https://pptr.dev/)

---

## Usage

To setup the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/theg1239/gravitas-scraper.git
   ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the server:
    ```bash
    node proxy.js
    ```

---

## Contributing

Contributions to improve the project are welcome. Open a PR and it will be reviewed by collaborators.

