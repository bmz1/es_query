export interface Video {
    id: string;
    title: string;
    publishAt: string;
    description: string;
  }
  
  export interface SearchResponse<T> {
    hits: {
      hits: Array<{
        _source: T;
      }>;
    };
    aggregations?: {
      closest_premier: {
        hits: {
          hits: Array<{
            _source: T;
          }>;
        };
      };
      published_videos: {
        hits: {
          hits: {
            hits: Array<{
              _source: T;
            }>;
          };
        };
      };
    };
  }