/**
 * The research the landing page leans on, linked from "Pillars starts from
 * the other end". Keep the copy that cites these close to what they found.
 */
export interface Source {
  id: string
  url: string
}

export const SOURCES = {
  /** Masicampo and Baumeister (2011): a specific plan stops an unfinished goal intruding. */
  plans: {
    id: 'plans',
    url: 'https://users.wfu.edu/masicaej/MasicampoBaumeister2011JPSP.pdf',
  },
  /** Gollwitzer and Sheeran (2006): if-then plans, d = 0.65 across 94 studies. */
  intentions: {
    id: 'intentions',
    url: 'https://www.researchgate.net/publication/37367696_Implementation_Intentions_and_Goal_Achievement_A_Meta-Analysis_of_Effects_and_Processes',
  },
} satisfies Record<string, Source>
