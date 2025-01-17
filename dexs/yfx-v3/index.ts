import request, { gql } from "graphql-request";
import { Fetch, SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";

const chains = [CHAIN.ARBITRUM]
const KEY = '1079471f4ef05e4e9637de21d4bb7c6a'

const endpoints: { [key: string]: string } = {
  [CHAIN.ARBITRUM]: "https://gateway-arbitrum.network.thegraph.com/api/"+KEY+"/subgraphs/id/wTKJtDwtthHZDpp79HbHuegwJRqisjevFDsRtAiSShe"
}

const historicalDailyData = gql`
  query marketInfoDailies($dayTime: String!){
    marketInfoDailies(where: {dayTime: $dayTime}) {
      liqVol
      totalVol
    }
  }
`
const historicalTotalData = gql`
  query markets {
    markets {
      # liqVol
      totalVol
    }
  }
`

interface IGraphResponse {
  marketInfoDailies: Array<{
    liqVol: string,
    totalVol: string,
  }>
}
interface IGraphResponse {
  markets: Array<{
    liqVol: string,
    totalVol: string,
  }>
}


const getFetch = (chain: string): Fetch => async (timestamp: number) => {
  const dayTimestamp = getUniqStartOfTodayTimestamp(new Date((timestamp * 1000)))
//  console.log(dayTimestamp, timestamp);
  
  const dailyData: IGraphResponse = await request(endpoints[chain], historicalDailyData, {
    dayTime: String(dayTimestamp),
  })
  //console.log('dailyData', chain, dailyData);
  let dailyVolume = 0;
  for(let i in dailyData.marketInfoDailies) {
    dailyVolume += parseFloat(dailyData.marketInfoDailies[i].totalVol)
  }
  
  const totalData: IGraphResponse = await request(endpoints[chain], historicalTotalData, {})
  let totalVolume = 0;
  for(let i in totalData.markets) {
    totalVolume += parseFloat(totalData.markets[i].totalVol)
  }

  //console.log('totalData', chain, totalData);
  
  //console.log(dailyVolume, totalVolume);
  
  return {
    timestamp: dayTimestamp,
    dailyVolume: dailyVolume.toString(),
    totalVolume: totalVolume.toString()
  }
}

const getStartTimestamp = async (chain: string) => {
  const startTimestamps: { [chain: string]: number } = {
    [CHAIN.ARBITRUM]: 1691128800,
  }
  return startTimestamps[chain]
}


const volume = chains.reduce(
  (acc, chain) => ({
    ...acc,
    [chain]: {
      fetch: getFetch(chain),
      start: async () => getStartTimestamp(chain)
    },
  }),
  {}
);

const adapter: SimpleAdapter = {
  adapter: volume
};
export default adapter;
