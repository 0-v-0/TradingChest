import bollingerBandWidth from './bollingerBandWidth'
import chaikinVolatility from './chaikinVolatility'
import donchianChannels from './donchianChannels'
import historicalVolatility from './historicalVolatility'
import keltnerChannels from './keltnerChannels'
import massIndex from './massIndex'
import standardDeviation from './standardDeviation'
import ulcerIndex from './ulcerIndex'

const volatilityIndicators = [
  keltnerChannels,
  donchianChannels,
  historicalVolatility,
  standardDeviation,
  chaikinVolatility,
  massIndex,
  ulcerIndex,
  bollingerBandWidth,
]

export default volatilityIndicators
