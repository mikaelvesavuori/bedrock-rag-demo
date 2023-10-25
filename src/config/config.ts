type ModelConfiguration = {
  model?: Model;
  region?: string;
};

type Model =
  | `amazon.titan-tg1-large`
  | `amazon.titan-e1t-medium`
  | `amazon.titan-embed-g1-text-02`
  | `amazon.titan-text-express-v1`
  | `amazon.titan-embed-text-v1`
  | `stability.stable-diffusion-xl`
  | `stability.stable-diffusion-xl-v0`
  | `ai21.j2-grande-instruct`
  | `ai21.j2-jumbo-instruct`
  | `ai21.j2-mid`
  | `ai21.j2-mid-1`
  | `ai21.j2-ultra`
  | `ai21.j2-ultra-v1`
  | `anthropic.claude-instant-v1`
  | `anthropic.claude-v1`
  | `anthropic.claude-v2`
  | `cohere.command-text-v14`;

export type Configuration = {
  region: string;
  model: Model;
  modelSettings: {
    maxTokens: number;
    temperature: number;
    region: string;
  };
};

export const config = (modelConfiguration: ModelConfiguration): Configuration => {
  const DEFAULT_REGION = 'us-east-1';
  const DEFAULT_MODEL = 'ai21.j2-ultra-v1';

  const model = modelConfiguration?.model || DEFAULT_MODEL;
  const region = modelConfiguration?.region || DEFAULT_REGION;

  return {
    region,
    model,
    modelSettings: { maxTokens: 1525, temperature: 0.7, region }
  };
};
