import { client } from "./es-client.ts";
import { VideoService } from "./video-service.ts";

async function main() {
  const videoService = new VideoService(client);

  try {
    await videoService.setupIndex();

    const testVideos = Array.from({ length: 35 }, (_, i) => ({
      id: `video-${i}`,
      title: `Video ${i}`,
      description: `Description ${i}`,
      publishAt: new Date(Date.now() + (i - 30) * 24 * 60 * 60 * 1000)
        .toISOString(),
    }));

    await videoService.indexVideos(testVideos);

    console.log("Page 1: ", await videoService.getVideosWithPremier(1, 10));
    console.log("\nPage 2:", await videoService.getVideosWithPremier(2, 10));
  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  main();
}
