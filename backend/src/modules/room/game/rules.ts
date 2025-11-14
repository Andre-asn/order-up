type BaseConfig = {
    impastaCount: number;
    roundProposals: [number, number, number, number, number];
    failureThreshold: [number, number, number, number, number];
};

type ClassicConfig = BaseConfig;

type HiddenConfig = BaseConfig & {
    impastasKnown: number;
    impastasHidden: number;
};

type HeadChefConfig = BaseConfig & {
    impastasKnown: number;
    impastasHidden: number;
    hasHeadChef: true;
    allowRedemption: true;
};

export type GameConfig = ClassicConfig | HiddenConfig | HeadChefConfig;

type GamemodeConfigs = {
    classic: ClassicConfig;
    hidden: HiddenConfig;
    headChef: HeadChefConfig;
};

export const GAME_CONFIGS: Record<number, GamemodeConfigs> = {
    6: {
        classic: {
            impastaCount: 2,
            roundProposals: [2, 3, 4, 3, 4],
            failureThreshold: [1, 1, 1, 1, 1],
        },
        hidden: {
            impastaCount: 2,
            roundProposals: [2, 3, 4, 3, 4],
            failureThreshold: [1, 1, 1, 1, 1],
            impastasKnown: 0,
            impastasHidden: 2,
        },
        headChef: {
            impastaCount: 2,
            roundProposals: [2, 3, 4, 3, 4],
            failureThreshold: [1, 1, 1, 1, 1],
            impastasKnown: 2,
            impastasHidden: 0,
            hasHeadChef: true,
            allowRedemption: true,
        },
    },
    7: {
        classic: {
            impastaCount: 3,
            roundProposals: [2, 3, 3, 4, 4],
            failureThreshold: [1, 1, 1, 2, 1],
        },
        hidden: {
            impastaCount: 3,
            roundProposals: [2, 3, 3, 4, 4],
            failureThreshold: [1, 1, 1, 2, 1],
            impastasKnown: 2,
            impastasHidden: 1,
        },
        headChef: {
            impastaCount: 3,
            roundProposals: [2, 3, 3, 4, 4],
            failureThreshold: [1, 1, 1, 2, 1],
            impastasKnown: 2,
            impastasHidden: 1,
            hasHeadChef: true,
            allowRedemption: true,
        },
    },
    8: {
        classic: {
            impastaCount: 3,
            roundProposals: [3, 4, 4, 5, 5],
            failureThreshold: [1, 1, 1, 2, 1],
        },
        hidden: {
            impastaCount: 3,
            roundProposals: [3, 4, 4, 5, 5],
            failureThreshold: [1, 1, 1, 2, 1],
            impastasKnown: 2,
            impastasHidden: 1,
        },
        headChef: {
            impastaCount: 3,
            roundProposals: [3, 4, 4, 5, 5],
            failureThreshold: [1, 1, 1, 2, 1],
            impastasKnown: 2,
            impastasHidden: 1,
            hasHeadChef: true,
            allowRedemption: true,
        },
    },
};

export function getGameConfig(playerCount: number, gamemode: 'classic' | 'hidden' | 'headChef'): GameConfig {
    const configs = GAME_CONFIGS[playerCount];
    if (!configs) throw new Error(`No configuration for ${playerCount} players`);
    
    const config = GAME_CONFIGS[playerCount][gamemode];
    return config as GameConfig;
}