import lodash from 'lodash'
import { bigCombination, combination } from 'js-combinatorics'
import { cardToString, SUITS, RANKS, SYMBOLS, ALIASES } from './cards'
import runtime from '@skypager/runtime'
import { CardGroup, OddsCalculator } from 'poker-tools'
import HAND_STRENGTHS from './info/hand-strength.json'

const [ TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING, ACE ] = RANKS;
const { chunk, meanBy, groupBy, uniq, map, mapValues, uniqBy, isString, isArray, isFunction, isObject, sortBy, min, max, flatten } = lodash

export const combosMap = new Map()
export const flopsMap = new Map()
export const turnsMap = new Map()
export const riversMap = new Map()

export const SKLANKSY_RANGES = { 
  '1': 'AA,KK,QQ,JJ,AKs',
  '2': 'TT,AQs,AJs,KQs,AKo',
  '3': '99,JTs,QJs,ATs,AQo',
  '4': 'T9s,KQo,88,QTs,98s,J9s,AJo,KTs',
  '5': '77,87s,Q9s,T8s,KJo,QJo,JTo,76s,97s,A9s,A8s,A7s,A6s,A5s,A4s,A3s,A2s,65s',
  '6': '66,ATo,55,86s,KTo,QTo,54s,K9s,J8s,75s',
  '7': '44,J9o,64s,T9o,53s,33,98o,43s,22,K9s,K8s,K7s,K6s,K5s,K4s,K3s,K2s',
  '8': '87,A9o,Q9o,76o,42s,32s,96s,85s,J8o,J7s,65o,54o,74s,K9o,T8o' 
}

export function generateCombos(count, deadCards = []) {
  const generator = combination(Range.cards.map(c => c.name), count);

  const combos = [];
  let a;

  while ((a = generator.next())) {
    combos.push(a);
  }

  return combos.filter(combo => !deadCards.find(i => combo.indexOf(i) > -1));
}

function sklansky(groupNumber, deadCards = []) {
  return new Range(SKLANKSY_RANGES[String(groupNumber)], deadCards);
}

export default class Range {
  static async compareSklanskyRanges(options = {}) {
    const matchups = combination(['ultraStrong', 'strong', 'medium', 'loose'], 2)
    for(let matchup of matchups) {
      const [i1, i2] = matchup
      await Range.sklansky[i1].compare(Range.sklansky[i2], options)
    }
  }

  static sklansky = Object.assign(sklansky, {
    get ultraStrong() { return sklansky(1) },
    get strong() { return new Range(`${sklansky(1).input},${sklansky(2).input}`) },
    get medium() { return new Range(`${sklansky(1).input},${sklansky(2).input},${sklansky(3).input},${sklansky(4).input},${sklansky(5).input}`) },
    get loose() { return new Range(`${sklansky(1).input},${sklansky(2).input},${sklansky(3).input},${sklansky(4).input},${sklansky(5).input},${sklansky(6).input},${sklansky(7).input} `) },
  })

  constructor(rangeInput = '', deadCards = []) {
    this.deadCards = deadCards 
    this.input = rangeInput
  }

  toJSON() {
    return {
      maxShowdown: this.maxShowdown,
      minShowdown: this.minShowdown,
      percentile: this.percentile,
      strength: this.strength,
      size: this.size,
      strengthDistribution: this.strengthDistribution,
      combos: this.combos.map(combo => combo.toJSON()),

    }
  }

  get strengthDistribution() {
    const { groupBy, mapValues } = lodash
    return mapValues(groupBy(this.combos, 'showdown'), 'length')
  }

  get maxShowdown() {
    return max(this.combos.map(c => c.showdown))
  }

  get minShowdown() {
    return min(this.combos.map(c => c.showdown))
  }

  get percentile() {
    return (this.size / this.constructor.combos.length) * 100
  }

  get strength() {
    return (this.size / this.constructor.combos.length) * 100
  }

  get size() {
    return this.combos.length
  }

  get combos() {
    const notDead = (comboName) => !this.deadCards.find(card => comboName.indexOf(card) >= 0)
    return Range.filterCombos(this.input).filter(combo => notDead(combo.name))
  }

  static get cardsMap() {
    return Range.chain.get('cards').keyBy('name').value()
  }
  
  get cardsMap() {
    return Range.chain.get('cards').keyBy('name').value()
  }

  get comboNames() {
    return this.combos.map(c => c.name)
  }

  get normalizedCombos() {
    return this.chain.get('combos')
      .groupBy('normalized')
      .value()
  }

  get normalizedComboNames() {
    return Object.keys(this.normalizedCombos)
  }

  get hash() {
    return runtime.hashObject(this.comboNames)
  }

  async compare(range, options) {
    const results = await this.createCalculators(range, options).run()

    const numbers = results
      .map(({ matchup, equities }) => {
        return matchup.map((m,i) => {
          const e = equities[i]
          const d = e.possibleHandsCount;
          const w = e.bestHandCount
          const t = e.tieHandCount
          const advantage =
            Range.combosMap.get(m).vsOnePlayer -
            Range.combosMap.get(matchup[i === 0 ? 1 : 0]).vsOnePlayer;
          return [m, parseFloat(((w / d) * 100).toFixed(2)), parseFloat(((t/d) * 100).toFixed(2)), advantage, advantage > 0]
        })
      })
      .map((results) => {
        if (results[0][4] && results[0][1] < results[1][1]) {
          results[0].push(true)
          results[1].push(false)
        } else {
          results[0].push(false)
          results[1].push(true)
        }
        return results
      })

    const ourWins = meanBy(numbers, i => i[0][1])
    const theirWins = meanBy(numbers, i => i[1][1])

    return {
      us: this.input,
      them: range.input,
      ours: ourWins,
      theirs: theirWins,
      tie: meanBy(numbers, i => i[0][2]),
      ...options.full && { numbers }
    } 
  }
  
  createCalculators(anotherRange, { reduce = true, board = '', iterations = 50000 } = {}) {
    // need to exclude cards which are on the board
    const matchups = Object.values(this.generateMatchups(anotherRange, { reduce, board }))
      .flat()

    const cardGroups = matchups.map((matchup) => matchup.map(i => CardGroup.fromString(i)))

    const base = {
      board,
      ranges: [this.input, anotherRange.input],
      hashes: [this.hash, anotherRange.hash]
    }; 

    const cacheKey = runtime.hashObject({
      h: base.hashes.join(':'),
      iterations,
      board
    })

    const output = () => cardGroups.map((cg,i) => {
      const matchup = matchups[i]
      const results = OddsCalculator.calculateEquity(cg, board && board.length ? CardGroup.fromString(board) : board, iterations)
      return { ...base, matchup, ...results }
    }) 

    return {
      ...base,
      matchups,
      run: async () => {
        const exists = await runtime.fileManager.cache.get.info(cacheKey)

        if (exists) {
          const data = await runtime.fileManager.cache
            .get(cacheKey)
            .then(r => JSON.parse(String(r.data)))
          return data
        } else {
          const data = output()
          await runtime.fileManager.cache
            .put(cacheKey, JSON.stringify(data))
          return data
        }
      }
    }
  }

  generateMatchups(anotherRange, { reduce = true, board = '' } = {}) {
    const { combos } = this
    const boardCards = chunk(board.split(''), 2).map(i => i.join(''))
    const entries = combos.map((combo) => {
      const dead = combo.map(x => x.name).concat(boardCards)
      return [ 
        combo.normalized,  
        Object.values(anotherRange.normalizedCombosExcluding(dead.concat(combo.map(i => i.name)))).flat()
      ]
    })
    
    const normalized = this.normalizedCombos

    const hasCard = (combo) =>
      !!chunk(combo.split(''), 2).map(i => i.join('')).find(comboCard => boardCards.indexOf(comboCard) > -1)

    const matchups = entries
      .map(([src, combos]) => combos.map(c => {
        const available = normalized[src]
        const candidate = available.find(i => i.name !== c)
        const id = candidate ? candidate.name : src;
        return [id, c]
      }))
      .flat()
      .filter(matchup => !isBlocked(matchup[0], matchup[1]) && !hasCard(matchup[0]) && !hasCard(matchup[1]))
    
    const grouped = groupBy(matchups, (i) => i[0])

    if (!reduce) { 
      return grouped 
    }

    return mapValues(grouped, (matches) => {
      const seen = {}
      return matches.filter(m => {
        const combo = Range.combosMap.get(m[1])

        if (seen[combo.normalized]) {
          return false
        }

        seen[combo.normalized] = true

        return true
      })
    })
  }

  normalizedCombosExcluding(deadCards = []) {
    return this.chain
      .get('normalizedCombos')
      .mapValues((combos) => combos.filter((combo) => !deadCards.find(card => combo.name.indexOf(card) >= 0)))
      .mapValues(combos => uniq(map(combos, 'name')))
      .value()
  }

  get sample() {
    const { combos } = this  

    const pairs = uniqBy(combos.filter(c => c.pair), 'rank')
    const offsuit = uniqBy(combos.filter(c => !c.pair && c.offsuit), (i) => [i[0].suit,i.rank,i.kicker].join(':'))
    const suited = uniqBy(combos.filter(c => !c.pair && c.suited), (i) => [i[0].suit,i.rank,i.kicker].join(':'))

    return uniqBy([
      ...pairs,
      ...offsuit,
      ...suited,
    ], (c) => c.toString())
  }

  static get chain() {
    return lodash.chain(this)
  }

  static get chains() {
    return {
      combos: Range.chain.get('combos'),
      cards: Range.chain.get('cards'),
      flops: Range.chain.get('flops'),
      rivers: Range.chain.get('rivers'),
      turns: Range.chain.get('turns')
    }
  }

  get chain() {
    return lodash.chain(this)
  }

  static get cards() {
    return flatten(
      RANKS.map((rank) => SUITS.map((suit) => ({ suit, rank, name: cardToString({ suit, rank }) })))
    )
  }

  static get all() {
    return Array
      .from(this.combosMap.keys())
  }

  static get combos() {
    const c = Array.from(this.combosMap.values())
    return sortBy(c, 'showdown') 
  }

  static get suited() {
    return this.combos
      .filter(i => i[0].suit === i[1].suit)
  }

  static get suitedConnectors() {
    return this.suited
      .filter(i => Math.abs(i[1].rank - i[0].rank) === 1)
  }

  static get suitedOneGap() {
    return this.suited
      .filter(i => Math.abs(i[1].rank - i[0].rank) === 2)
  }

  static get suitedTwoGap() {
    return this.suited
      .filter(i => Math.abs(i[1].rank - i[0].rank) === 3)
  } 

  static get suitedThreeGap() {
    return this.suited
      .filter(i => Math.abs(i[1].rank - i[0].rank) === 4)
  } 

  static get pocketPairs() {
    return this.combos
      .filter(i => i[0].rank === i[1].rank)
  }

  static get cardNames() {
    return this.cards.map(c => c.name)
  }

  static get comboNames() {
    return this.combos.map(c => c.name)
  } 

  static asGrid() {
    const ranks = [ACE, KING, QUEEN, JACK, TEN, NINE, EIGHT, SEVEN, SIX, FIVE, FOUR, THREE, TWO]  

    const grid = ranks.map(row => {
      const down = ranks.map(column => {
        const isOffsuit = row < column
        const isPair = row === column
        const marker = isPair ? '' : (isOffsuit ? 'o' : 's')

        const cards = sortBy([
          Range.cards.find(card => card.rank === row),
          Range.cards.find(card => card.rank === column)
        ], 'rank').reverse()

        return cards.map(c => c.name.split('')[0]).concat([marker]).join('')
      })

      return down
    })

    return grid 
  } 

  static strongestHands(percent, numberOfOpponents = 9) {
    const limit = Math.floor(169 * (percent / 100))

    return this.chains.combos
      .sortBy(`strengthVsOpponents.${numberOfOpponents}`)
      .reverse()
      .uniqBy("normalized")    
      .slice(0, limit)
      .map('normalized')
      .value()
  }

  static get normalizedComboInfo() {
    return this.chains.combos
    .groupBy('normalized')
      .mapValues((combos, name) => ({
        name,
        count: combos.length,
        rank: combos[0].rank,
        kicker: combos[0].kicker,
        suited: combos[0].suited,
        oddsVsPlayers: combos[0].strengthVsOpponents.reduce((memo,val,i) => ({
          ...memo,
          [i + 1]: val,
        }),{})
      }))    
      .value()
  }

  static get strengthChart() {
    return this.chains
      .combos
      .keyBy('normalized')
      .mapValues('strengthVsOpponents')
      .value()
  }

  static get combosMap() {
    const cards = this.cards

    if (Array.from(combosMap.values()).length) {
      return combosMap
    }

    cards.forEach((c1) => {
      cards.forEach(c2 => {
        if (c1.name !== c2.name) {
          let combo = sortBy([c1, c2], 'rank', 'suit').reverse()
          const maxRank = max([c1.rank, c2.rank])
          const minRank = min([c1.rank, c2.rank])

          Object.assign(combo, {
            toJSON() {
              return {
                name: combo.name,
                normalized: combo.normalized,
                showdown: combo.showdown,
                averageEquity: combo.strengthVsOpponents,
                strengthVsOpponents: combo.strengthVsOpponents,
                pair: combo.pair,
                offsuit: combo.offsuit,
                kicker: combo.kicker,
                rank: combo.rank,
                suited: combo.suited,
                gap: combo.gap
              }
            },
            toString() {
              return combo.map(v => v.name).join(',')
            },
            has(...names) {
              return !!combo.find(i => names.indexOf(i.name) > -1 || names.find(x => i.name.match(String(x))))
            },
            cardGroup() {
              return CardGroup.fromString(this.name) 
            },
            get name() {
              return combo.map(v => v.name).join('')  
            },
            get csv() {
              return combo.map(v => v.name).join(',')  
            },
            get normalized() {
              if (this.pair) {
                return [SYMBOLS[this.rank], SYMBOLS[this.rank]].join("")
              } else if (this.suited) {
                return combo.map(c => SYMBOLS[c.rank]).join("") + "s" 
              } else if (this.offsuit) {
                return combo.map(c => SYMBOLS[c.rank]).join("") + "o" 
              }
            },
            get showdown() {
              if (this.pair) {
                return (12 ** 5) + (this.rank + 1 * (12 ** 3))
              } else {
                return (this.rank + 1 * (12 ** 3)) + (this.kicker + 1 * (12 ** 2)) 
              }
            },
            get strengthVsOpponents() {
              return HAND_STRENGTHS[this.normalized] 
            },
            get vsOnePlayer() {
              return HAND_STRENGTHS[this.normalized][0]
            },
            get vsTwoPlayers() {
              return HAND_STRENGTHS[this.normalized][1]
            },
            get vsThreePlayers() {
              return HAND_STRENGTHS[this.normalized][2]
            },           
            get averageEquity() {
              return HAND_STRENGTHS[this.normalized] 
            },
            get pair() {
              return c1.rank === c2.rank
            },
            get offsuit() {
              return c1.suit !== c2.suit && (c1.rank !== c2.rank)
            },
            get suited() {
              return c1.suit === c2.suit
            },
            get gap() {
              return Math.abs(c1.rank - c2.rank)  
            },
            get rank() {
              return maxRank
            },
            get kicker() {
              return minRank  
            }
          })
        
          combosMap.set(
            combo.map(c => c.name).join(''),
            combo
          )          
        }
      }) 
    })

    return combosMap 
  }

  static get flops() {
    return Array.from(this.flopsMap.values())
  }

  static get turns() {
    return Array.from(this.turnsMap.values())
  }

  static get rivers() {
    return Array.from(this.riversMap.values())
  }

  static get flopsMap() {
    const cards = this.cards

    if (Array.from(flopsMap.values()).length) {
      return flopsMap
    }

    cards.forEach((c1) => {
      cards.forEach(c2 => {
        cards.forEach(c3 => {
          if (uniq([c1.name, c2.name, c3.name]).length === 3) {
            let combo = sortBy([c1, c2, c3], "rank", "suit").reverse();
            const maxRank = max([c1.rank, c2.rank, c3.rank]);
            const minRank = min([c1.rank, c2.rank, c3.rank]);
  
            Object.assign(combo, {
              toJSON() {
                return Object.getOwnPropertyNames(combo)
                  .filter(key => key !== 'textureHash', key !== 'toJSON' && key !== 'has' && key !== 'cardGroup')
                  .reduce((memo,name) => ({
                    ...memo,
                    [name]: this[name]
                  }), {
                    cards: combo.map(c => c)
                  })
              },
              get baseTexture() {
                return runtime.hashObject(['maxRank', 'minRank', 'uniqSuits', 'uniqRanks', 'numberOfBroadwayCards', 'threeMediumCards', 'threeSmallCards', 'gaps'].reduce((memo,key) => ({
                  [key]: this[key],
                  ...memo  
                }), {}))
              },
              get maxRank() {
                return maxRank;
              },
              get name() {
                return sortBy(combo, "rank")
                  .map(c => c.name)
                  .join("");
              },
              has(...names) {
                return !!combo.find(
                  i =>
                    names.indexOf(i.name) > -1 ||
                    names.find(x => i.name.match(String(x)))
                );
              },
              get minRank() {
                return minRank;
              },
              get uniqSuits() {
                return uniq(combo.map(c => c.suit)).length;
              },
              get ranks() {
                return sortBy(combo, "rank").map(c => c.rank);
              },
              get uniqRanks() {
                return uniq(combo.map(c => c.rank)).length;
              },
              get flushPossible() {
                return combo.uniqSuits === 1;
              },
              get flushDraw() {
                return combo.uniqSuits === 2;
              },
              get rainbow() {
                return combo.uniqSuits >= 3;
              },
              get sameRank() {
                return combo.uniqRanks === 1;
              },
              get paired() {
                return combo.uniqRanks === 2;
              },
              get trips() {
                return combo.uniqRanks === 1;
              },
              get hasAce() {
                return !!combo.find(c => c.name.startsWith("A"));
              },
              get hasKing() {
                return !!combo.find(c => c.name.startsWith("K"));
              },
              get hasQueen() {
                return !!combo.find(c => c.name.startsWith("Q"));
              },
              get hasJack() {
                return !!combo.find(c => c.name.startsWith("J"));
              },
              get hasTen() {
                return !!combo.find(c => c.name.startsWith("T"));
              },
              get numberOfBroadwayCards() {
                return combo.filter(c => c.name.match(/^[AKQJT]/i))
                  .length;
              },
              get threeMediumCards() {
                return (
                  combo.filter(c => c.name.match(/^[789T]/i))
                    .length === 3
                );
              },
              cardGroup() {
                return CardGroup.fromString(this.name);
              },
              get threeSmallCards() {
                return (
                  combo.filter(c => c.name.match(/^[23456]/i))
                    .length === 3
                );
              },
              get gaps() {
                const ranks = this.ranks.map(i => i + 1);

                let values;

                if (ranks[2] === 13 && ranks[1] < 9) {
                  values = [0, ranks[0], ranks[1]];
                } else {
                  values = ranks;
                }

                return [
                  values[1] - values[0] - 1,
                  values[2] - values[1] - 1
                ];
              },
              get openEnded() {
                return this.gaps[0] === 0 && this.gaps[1] === 0;
              },
              get possibleStraights() {
                return (
                  this.openEnded ||
                  !!this.gaps.find(i => i >= 0 && i <= 2)
                );
              }
            });
  
            flopsMap.set(combo.map(c => c.name).join(""), combo);
          }          
        })
      }) 
    })

    return flopsMap 
  }

  static get turnsMap() {
    const cards = this.cards

    if (Array.from(turnsMap.values()).length) {
      return turnsMap
    }

    cards.forEach((c1) => {
      cards.forEach(c2 => {
        cards.forEach(c3 => {
          cards.forEach(c4 => {
            if (uniq([c1.name, c2.name, c3.name, c4.name]).length === 4) {
              let combo = sortBy([c1, c2, c3, c4], "rank", "suit").reverse();
              const maxRank = max([c1.rank, c2.rank, c3.rank, c4.rank]);
              const minRank = min([c1.rank, c2.rank, c3.rank, c4.rank]);
    
              Object.assign(combo, {
                get maxRank() {
                  return maxRank;
                },
                get minRank() {
                  return minRank;
                },
                get name() {
                  return combo.map(c => c.name).join("");
                },
                has(...names) {
                  return !!combo.find(
                    i =>
                      names.indexOf(i.name) > -1 ||
                      names.find(x => i.name.match(String(x)))
                  );
                }
              });
    
              turnsMap.set(combo.map(c => c.name).join(""), combo);
            }          
          })
        })
      }) 
    })

    return turnsMap 
  }


  static get riversMap() {
    const cards = this.cards

    if (Array.from(riversMap.values()).length) {
      return riversMap
    }

    cards.forEach((c1) => {
      cards.forEach(c2 => {
        cards.forEach(c3 => {
          cards.forEach(c4 => {
            cards.forEach(c5 => {
              if (uniq([c1.name, c2.name, c3.name, c4.name, c5.name]).length === 5) {
                let combo = sortBy([c1, c2, c3, c4, c5], "rank", "suit").reverse();
                const maxRank = max([c1.rank, c2.rank, c3.rank, c4.rank, c5.rank]);
                const minRank = min([c1.rank, c2.rank, c3.rank, c4.rank, c5.rank]);
      
                Object.assign(combo, {
                  get maxRank() {
                    return maxRank;
                  },
                  get minRank() {
                    return minRank;
                  },
                  has(...names) {
                    return !!combo.find(
                      i =>
                        names.indexOf(i.name) > -1 ||
                        names.find(x => i.name.match(String(x)))
                    );
                  }
                });
      
                riversMap.set(combo.map(c => c.name).join(""), combo);
              }                        
            })
          })
        })
      }) 
    })

    return riversMap 
  }  


  static filterCombos(filters) {
    if (isFunction(filters)) {
      return Range.chain.get('combos').filter(filters).value()
    } else if (isString(filters)) {
      return Range.filterCombos(Range.parseRange(filters))
    } else if (isArray(filters)) {
      return flatten(
        filters.map(Range.filterCombos)
      )
    } else if (isObject(filters)) {
      return Range.combos.filter((combo) => filterCombo(combo, filters))
    }
  }

  static fromString(input = '') {
    const filters = this.parseRange(input)
    const results = this.filterCombos(filters)
    return results
  }
  
  static expandHand(str) {
    const parts = str.split("");
    const [rankOne, rankTwo, ...modifiers] = parts;
    const modifier = modifiers.join("");
    const rankValues = [ALIASES[rankOne], ALIASES[rankTwo]].sort().reverse();

    if (rankValues[0] < rankValues[1]) {
      return this.expandHand([rankTwo, rankOne, ...modifiers].join(""))
    }
  
    return {
      item: str,
      pair: rankOne === rankTwo,
      modifier,
  
      connected:
        rankValues[0] === ACE
          ? rankValues[1] === TWO || rankValues[1] === KING
          : rankValues[0] - rankValues[1] === 1,
  
      oneGap:
        rankValues[0] === ACE
          ? rankValues[1] === THREE || rankValues[1] === QUEEN
          : rankValues[0] - rankValues[1] === 2,
  
      twoGap:
        rankValues[0] === ACE
          ? rankValues[1] === FOUR || rankValues[1] === JACK
          : rankValues[0] - rankValues[1] === 3,
  
      threeGap:
        rankValues[0] === ACE
          ? rankValues[1] === FOUR || rankValues[1] === JACK
          : rankValues[0] - rankValues[1] === 4,
  
      suited: modifier.toLowerCase().startsWith("s"),
      greater: modifier.toLowerCase().endsWith("+"),
      weaker: modifier.toLowerCase().endsWith("-"),
      ranks: rankValues,
      rank: max(rankValues),
      kicker: min(rankValues)
    };
  }

  static possibleOpponentCombos(heroHand, numberOfOpponents = 8, slice = 0) {
    const allCards = Range.cardNames 
    const combos = bigCombination(allCards, numberOfOpponents * 2)
    return combos.length
  } 

  static parseRange(input = '') {
    const items = String(input).trim().split(',').map(s => s.trim())
    return items.map(str => {
      if (str.match('-')) {
        let [top, bottom] = sortBy(str.split('-').map(i => i.trim()).map(h => Range.expandHand(h)), 'rank', 'kicker').reverse()

        if (top.rank === bottom.rank && !top.pair && !bottom.pair) {
          top = { ...top, weaker: true, oneGap: false, twoGap: false, threeGap: false, connected: false }  
          bottom = { ...bottom, greater: true, oneGap: false, twoGap: false, threeGap: false, connected: false }  
        }

        return { top, bottom, ranged: true }
      } else {
        return Range.expandHand(str)
      }
    })
  }

  static generateCombos = generateCombos
  static groups = groups
}

export function groups() {
  const pocketPairs = Range.chain
    .get("pocketPairs")
    .uniqBy("rank")
    .invokeMap("toString")
    .value();

  const offsuitKingsAndAces = Range.chain
    .get("combos")
    .filter(c => !c.pair && c.offsuit)
    .filter(c => c.rank >= 11)
    .uniqBy(i => i.rank + "," + i.kicker)
    .sortBy("rank")
    .invokeMap("toString")
    .value();

  const broadwayHands = Range.chain
    .get("combos")
    .filter(c => !c.pair && c.offsuit)
    .filter(c => c.rank > 8 && c.kicker >= 8)
    .uniqBy(i => i.rank + "," + i.kicker)
    .sortBy("rank")
    .invokeMap("toString")
    .value();

  const suitedBroadwayHands = Range.chain
    .get("combos")
    .filter(c => !c.pair && c.suited)
    .filter(c => c.rank > 8 && c.kicker >= 8)
    .uniqBy(i => i.suit + "," + i.rank + "," + i.kicker)
    .sortBy("rank")
    .invokeMap("toString")
    .value();

  const connectors = Range.chain
    .get("combos")
    .filter(c => c.offsuit && c.gap === 1)
    .uniqBy(i => i.suit + "," + i.rank + "," + i.kicker)
    .invokeMap("toString")
    .value();

  const suitedConnectors = Range.chain
    .get("suitedConnectors")
    .uniqBy(i => i.suit + "," + i.rank + "," + i.kicker)
    .invokeMap("toString")
    .value();

  const suitedOneGappers = Range.chain
    .get("suitedOneGap")
    .uniqBy(i => i.suit + "," + i.rank + "," + i.kicker)
    .invokeMap("toString")
    .value();

  const suitedAces = Range.chain
    .get("suited")
    .filter({ rank: 12 })
    .uniqBy(i => i.suit + "," + i.rank + "," + i.kicker)
    .invokeMap("toString")
    .value();

  return {
    pocketPairs,
    offsuitKingsAndAces,
    suitedConnectors,
    suitedAces,
    broadwayHands,
    suitedBroadwayHands,
    connectors,
    suitedOneGappers
  };
}


const filterCombo = (combo, filters) => {
  let match = true;
  const { item, ranged, top, bottom, pair, suited, greater, weaker, rank, kicker, connected, oneGap, twoGap, threeGap } = filters      
  // a pair is always greater than a non-pair range

  if (ranged) {
    return filterCombo(combo, {
      ...top,
      weaker: true
    }) && filterCombo(combo, {
      ...bottom,
      greater: true
    })
  }

  if (combo.normalized === item) {
    return true
  }

  // This would make KQs+ return pairs
  if (combo.pair && greater && !pair) {
    // return true;
  }

  if (suited && !combo.suited) {
    return false;
  }

  /*
  if (connected && !combo.connected) {
    return false;
  }

  if (oneGap && !combo.oneGap) {
    return false;
  }

  if (oneGap && !combo.oneGap) {
    return false;
  }
  */

  // If we are filtering by pairs
  if (pair && !combo.pair) {
    match = false;
  } else if (pair && greater && combo.pair && combo.rank < rank) {
    match = false;
  } else if (pair && weaker && combo.pair && combo.rank > rank) {
    match = false;
  } else if (pair && (!weaker && !greater && combo.rank !== rank)) {
    match = false;
  }

  if (!pair && greater) {
    if (combo.rank !== rank) {
      match = false;
    } else if (combo.rank === kicker && combo.kicker < rank) {
      match = false 
    } else if (combo.kicker < kicker) {
      match = false;
    }
  } else if (!pair && weaker) {
    if (combo.rank !== rank) {
      match = false;
    } else if (combo.rank === rank && combo.kicker > kicker) {
      match = false;
    }
  } else if (!pair && !greater && !weaker) {
    if (combo.rank !== rank || combo.kicker !== kicker) {
      match = false;
    }
  } 

  return match;
};

function defineProperties(source, obj = {}) {
  Object.entries(obj).map(([prop, cfg]) => Object.defineProperty(source, prop, { enumerable: false, ...cfg }))
}

function normalizeCombo(combo) {
  const labels = combo.trim().replace(/\W/g, '').split('')

  return [
    Range.cardsMap[`${labels[0]}${labels[1]}`],
    Range.cardsMap[`${labels[2]}${labels[3]}`],
  ]
}

function isBlocked(comboOne, ...combos) {
  const h1 = normalizeCombo(comboOne)
  const normalized = combos.map(c => normalizeCombo(c))
  return normalized.filter(h2 => !!h1.find(({ name }) => h2.find(h2 => h2.name === name))).length > 0
}

Range.isBlocked = isBlocked