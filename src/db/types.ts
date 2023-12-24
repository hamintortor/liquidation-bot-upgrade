// Define the types for user and task
type User = { id: number, wallet: string, contract: string, code: number, ton: bigint, usdt: bigint, usdc: bigint, state: string }
type Task = { id: number, wallet: string, contract: string, loan: bigint, collateral: bigint, liquidation: bigint, minCollateral: bigint, prices: string, signature: string, query: bigint, state: string }

// Define a function to convert one token to another
function convertToken(from: string, to: string, amount: bigint): bigint {
  // Use the prices cell to get the exchange rate
  let rate = getRate(from, to, prices)
  // Calculate the converted amount
  let converted = amount * rate
  // Return the converted amount
  return converted
}

// Define a function to liquidate a debt
function liquidateDebt(task: Task): bigint {
  // Use the contract address to get the debt information
  let debt = getDebt(task.contract)
  // Check if the debt is eligible for liquidation
  if (debt.loan > task.liquidation && debt.collateral < task.minCollateral) {
    // Use the signature to authorize the liquidation
    let authorized = authorize(task.signature)
    // If authorized, execute the liquidation
    if (authorized) {
      // Transfer the loan asset from the user to the contract
      transfer(task.wallet, task.contract, task.loan)
      // Transfer the collateral asset from the contract to the user
      transfer(task.contract, task.wallet, task.collateral)
      // Return the profit as the difference between the collateral and the loan
      return task.collateral - task.loan
    }
  }
  // Return zero if the debt is not eligible or authorized
  return 0
}

// Define a function to run the liquidation bot
function runBot(user: User): void {
  // Loop through the tasks assigned to the user
  for (let task of user.tasks) {
    // Check the state of the task
    if (task.state == "pending") {
      // Convert the collateral asset to the loan asset
      let converted = convertToken(task.collateral, task.loan, task.amount)
      // Liquidate the debt using the converted amount
      let profit = liquidateDebt(task)
      // Convert the profit back to the original collateral asset
      let final = convertToken(task.loan, task.collateral, profit)
      // Update the user's balance with the final profit
      user.balance += final
      // Update the state of the task to "completed"
      task.state = "completed"
    }
  }
}
