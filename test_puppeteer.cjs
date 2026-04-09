const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
        if(msg.type() === 'error') {
            console.log('CONSOLE ERROR:', msg.text());
            msg.args().forEach(arg => arg.jsonValue().then(v => console.log('ARG:', v)).catch(e => {}));
        }
    });

    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
        console.log('STACK:', error.stack);
    });

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000); // let it crash
    await browser.close();
})();
