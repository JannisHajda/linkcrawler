// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Cluster } from "puppeteer-cluster";
import { getRobotsTxt } from "../../helpers/parseRobots";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    res
      .status(200)
      .json({ message: "This endpoint is only available for get requests!" });
    return;
  }

  const body = JSON.parse(req.body);
  const baseUrl = body.url ?? null;

  if (!baseUrl) {
    res.status(200).json({ message: "Please provide a valid url!" });
    return;
  }

  console.log("starting crawling", baseUrl);

  let queue = [];
  let nodes = [];
  let relations = [];
  let depth = 0;
  const maxDepth = 3;
  const maxLinks = 1000;
  const internalOnly = false;

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    puppeteerOptions: { ignoreHTTPSErrors: true, headless: true },
  });

  cluster.on("taskerror", (err, data, willRetry) => {
    if (willRetry) {
      console.warn(
        `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`
      );
    } else {
      console.error(`Failed to crawl ${data}: ${err.message}`);
    }
  });

  await cluster.task(async ({ page, data }) => {
    await page.goto(data.url, { waitUntil: "networkidle2" });
    const links = await page.$$eval("a", (links) =>
      links.map((link) => link.href)
    );

    for (let link of links) {
      if (!nodes.find((node) => node.id === link)) {
        nodes.push({
          id: link,
          depth: data.depth,
        });

        if (internalOnly) {
          try {
            let linkName = new URL(link).host.split(".").slice(0, -1).join(".");
            let baseUrlName = new URL(baseUrl).host
              .split(".")
              .slice(0, -1)
              .join(".");

            if (linkName === baseUrlName) queue.push(link);
          } catch (e) {}
        } else queue.push(link);
      }

      let relation = relations.find(
        (rel) => rel.source === data.url && rel.target === link
      );

      if (!relation) {
        relation = {
          source: data.url,
          target: link,
          count: 1,
        };
        relations.push(relation);
      } else relation.count++;
    }

    return links;
  });

  nodes.push({
    id: baseUrl,
    depth,
  });

  depth++;

  cluster.queue({ url: baseUrl, depth });

  await cluster.idle();
  depth++;

  while (depth <= maxDepth && nodes.length < maxLinks && queue.length !== 0) {
    let tmpQueue = queue;
    queue = [];

    while (tmpQueue.length !== 0) {
      let link = tmpQueue.pop();
      cluster.queue({ url: link, depth });
    }

    await cluster.idle();
    depth++;
  }

  await cluster.close();
  console.log("finished crawling", baseUrl);
  res.status(200).json({ nodes, links: relations });
  //res.status(200).json({ nodes: [], links: [] });
}
