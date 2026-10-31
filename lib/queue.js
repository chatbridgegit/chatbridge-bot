//DEVELOPED BY CHATBRIDGE TEAM
import PQueue from 'p-queue'

//DEVELOPED BY CHATBRIDGE TEAM
export const messageQueue = new PQueue({
  concurrency: 5, 
  timeout: 30000, 
  throwOnTimeout: false
})
//DEVELOPED BY CHATBRIDGE TEAM
export const commandQueue = new PQueue({
  concurrency: 2

})
//DEVELOPED BY CHATBRIDGE TEAM
export const mediaQueue = new PQueue({
  concurrency: 2, 
  timeout: 60000, 
  throwOnTimeout: false
})
