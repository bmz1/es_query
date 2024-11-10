import { assertMatch, assertEquals } from "@std/assert";
// import { delay } from "https://deno.land/std/async/delay.ts";
import { client } from "../es-client.ts";
import { VideoService } from "../video-service.ts";
import { Video } from "../types.ts";

const generateTestVideos = (): Video[] => {
  const now = new Date();
  
  // Create past videos
  const pastVideos = Array.from({ length: 30 }, (_, i) => ({
    id: `past-${i}`,
    title: `Past Video ${i}`,
    description: `Description ${i}`,
    publishAt: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString()
  }));

  // Create future (premier) videos
  const futureVideos = Array.from({ length: 5 }, (_, i) => ({
    id: `future-${i}`,
    title: `Premier Video ${i}`,
    description: `Premier Description ${i}`,
    publishAt: new Date(now.getTime() + ((i + 1) * 24 * 60 * 60 * 1000)).toISOString()
  }));

  return [...pastVideos, ...futureVideos];
};

Deno.test("VideoService pagination with premiers", async (t) => {
  const videoService = new VideoService(client);
  
  await t.step("setup", async () => {
    await videoService.setupIndex();
    const testVideos = generateTestVideos();
    await videoService.indexVideos(testVideos);
  });

  await t.step("first page should include premier", async () => {
    const firstPage = await videoService.getVideosWithPremier(1, 10);
    assertEquals(firstPage.length, 11, "First page should have exactly 11 items");
    assertMatch(firstPage[firstPage.length - 1].id, /^future-/, "First video should be a premier");
  });

  await t.step("second page should not include premier", async () => {
    const secondPage = await videoService.getVideosWithPremier(2, 10);
    assertEquals(secondPage.length, 10, "Second page should have exactly 10 items");
    assertMatch(secondPage[0].id, /^past-/, "Second page should start with a past video");
  });

  await t.step("pagination should maintain consistent size", async () => {
    const thirdPage = await videoService.getVideosWithPremier(3, 10);
    assertEquals(thirdPage.length, 10, "Third page should have exactly 10 items");
  });

  await t.step("cleanup", async () => {
    await client.close();
  });
});
