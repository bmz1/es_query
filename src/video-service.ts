import { Client } from "@elastic/elasticsearch";
import { Video } from "./types.ts";

export class VideoService {
  private readonly indexName = "videos";

  constructor(private readonly client: Client) {}

  async setupIndex() {
    const exists = await this.client.indices.exists({
      index: this.indexName
    });

    if (exists) {
      await this.client.indices.delete({ index: this.indexName });
    }

    await this.client.indices.create({
      index: this.indexName,
      mappings: {
        properties: {
          id: { type: "keyword" },
          title: { type: "text" },
          publishAt: { type: "date" },
          description: { type: "text" }
        }
      }
    });
  }

  async indexVideos(videos: Video[]) {
    const operations = videos.flatMap(video => [
      { index: { _index: this.indexName } },
      video
    ]);

    const response = await this.client.bulk({ operations, refresh: true });
    return response
  }

  async getVideosWithPremier(page = 1, pageSize = 20): Promise<Video[]> {
    const isFirstPage = page === 1;
  
    const response = await this.client.search({
      index: this.indexName,
      aggs: {
        ...(isFirstPage && {
          closest_premier: {
            filter: {
              range: {
                publishAt: { gt: "now" }
              }
            },
            aggs: {
              hits: {
                top_hits: {
                  size: 1,
                  sort: [{ publishAt: { order: "asc" } }],
                  _source: true
                }
              }
            }
          }
        }),
        published_videos: {
          filter: {
            range: {
              publishAt: { lte: "now" }  // Only include already published videos
            }
          },
          aggs: {
            hits: {
              top_hits: {
                size: pageSize,  // Adjust size if premier is included
                from: (page - 1) * pageSize,
                sort: [{ publishAt: { order: "desc" } }],
                _source: true
              }
            }
          }
        }
      },
      size: 0,
    });
  
    // @ts-ignore 
    const premier = isFirstPage ? (response.aggregations?.closest_premier.hits.hits.hits || []) : [];
    // @ts-ignore
    const regular = response.aggregations?.published_videos.hits.hits.hits || [];
  
    if (isFirstPage && premier.length > 0) {
      return [...regular, ...premier].map(hit => hit._source as Video);
    }
  
    // @ts-ignore
    return regular.map(hit => hit._source as Video);
  }
}
