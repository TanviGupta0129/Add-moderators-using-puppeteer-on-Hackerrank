const puppeteer = require('puppeteer');
let fs = require("fs");
let credentialsFile = process.argv[2];
let metafile = process.argv[3];
let Modname = "Add moderator name";
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"]
    });
    let data = await fs.promises.readFile(credentialsFile);
    let { url, pwd, user } = JSON.parse(data);
    let tabs = await browser.pages();
    let page = tabs[0];

    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#input-1", { visible: true });
    await page.type("#input-1", user);
    await page.type("#input-2", pwd);

    await Promise.all([page.click("button[data-analytics=LoginPassword]"), 
        page.waitForNavigation({ waitUntil: "networkidle0" })]);
    await page.waitForSelector("a[data-analytics=NavBarProfileDropDown]", { visible: true });
    await page.click("a[data-analytics=NavBarProfileDropDown]");
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("a[data-analytics=NavBarProfileDropDownAdministration]")]);
    await page.waitForSelector(".administration header ul li ", { visible: true });
    
    let mtabs = await page.$$(".administration header ul li a");
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), mtabs[1].click()]);
    await handleQuestion(page, browser);
})();

async function handleQuestion(page, browser) {
    await page.waitForSelector(".backbone.block-center");
    let quesPage = await page.$$(".backbone.block-center");
    let pArr = [];
    for (let i = 0; i < quesPage.length; i++) {
        let newTab = await browser.newPage();
        let href = await page.evaluate(function (elem) {
            return elem.getAttribute("href");
        }, quesPage[i]);
        let mWillAddProm = handleSingleQuestion(newTab, "https://www.hackerrank.com" + href, i);
        pArr.push(mWillAddProm);
    }
    await Promise.all(pArr);
    await page.waitForSelector(".pagination ul li", { visible: true });
    let PaginationBtn = await page.$$(".pagination ul li");
    let nextBtn = await PaginationBtn[PaginationBtn.length - 2];
    let className = await page.evaluate(function (nextBtn) {
        return nextBtn.getAttribute("class");
    }, nextBtn);
    if (className === "disabled") {
        return;
    } else {
        await Promise.all([nextBtn.click(), page.waitForNavigation({ waitUntil: "networkidle0" })]);
        await handleQuestion(page, browser);
    }

}

async function handleSingleQuestion(newTab, link, i) {
    await newTab.goto(link, { waitUntil: "networkidle0" });
    await newTab.waitForSelector(".tag");
    await newTab.click("li[data-tab=moderators]");
    await newTab.waitForSelector("input[id=moderator]", { visible: true });
    await newTab.type("#moderator", Modname);
    await newTab.keyboard.press("Enter");
    await newTab.click(".save-challenge.btn.btn-green");
    await newTab.close();
}
