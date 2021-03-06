import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState } from "react";
import styles from "../styles/Home.module.css";
import dynamic from "next/dynamic";

const ForceGraph3D = dynamic(() => import("../noSSR/ForceGraph3D"), {
  ssr: false,
});

const Home: NextPage = () => {
  const [graphData, setGraphData] = useState(null);

  const crawl = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const data = e.target as typeof e.target & {
      url: { value: string };
    };

    const url = data.url.value;

    try {
      let res = await fetch("/api/crawl", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      res = await res.json();
      console.log(res);
      setGraphData(res);
    } catch (e) {
      console.error(e);
    }

    return;
  };
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">linkcrawl</a>
        </h1>
      </main>

      <form onSubmit={crawl}>
        <input
          type="text"
          name="url"
          placeholder="Enter the desired URL"
        ></input>
        <button type="submit">crawl</button>
      </form>

      {graphData ? (
        <ForceGraph3D
          graphData={graphData}
          nodeLabel={(node) => node.id}
          nodeAutoColorBy={(node) => node.depth}
          linkLabel={(link) => link.count}
          linkAutoColorBy={(link) => link.count}
        />
      ) : (
        <></>
      )}

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
};

export default Home;
