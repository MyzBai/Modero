

namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | undefined;
        ENV_IS_REMOTE: 'true' | 'false' | undefined;
    }
}
