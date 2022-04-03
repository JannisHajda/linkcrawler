import fetch from "node-fetch";
import Cache from "node-cache";
import robotsParser from "robots-txt-parser";

const robots = robotsParser({ allowOnNeutral: false });
const cache = new Cache();

(async () => {})();

const getRobotsTxt = async (url) => {
  try {
    url = new URL(url);
    await robots.useRobotsFor(url.origin);
    if (await robots.canCrawl(url.href)) console.log("Crawlable");
    else console.log("Not crawlable");
  } catch (e) {
    console.error(e);
  }
};

export { getRobotsTxt };
