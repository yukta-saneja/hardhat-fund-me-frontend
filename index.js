//we need to connect our website to a wallet in order to run a contract, so we check for a wallet which can be
//reflected using window.ethereum etc., if it doesnt exist, then there is no wallet extension in browser and we cant run contract
//refer to metamask docs for ethereum providers
//can add more try catches into ur code fromgithub repo
//import
import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw

//can do console.log(ethers) to view ethers object in ur console

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        //these condole.log lines are printed in right click on site-inspect-console
        //window.ethereum is only for metamask, we may need more extensions for other wallets
        // console.log("I see a metamask!")
        //function to request connect to the extended metamask
        //if we call it directly without a function, it will try to connect everytime site refreshes
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" })
        } catch (error) {
            console.log(error)
        }
        //await connection before moving further
        //  console.log("Connected!")
        //to chane name of button who called this function
        // document.getElementById("connectButton").innerHTML = "Connected!" , could do this way but we already imported the button
        connectButton.innerHTML = "Connected!"
    } else {
        //console.log("No metamask!")
        connectButton.innerHTML = "Please install Metamask!"
    }
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const balance = await provider.getBalance(contractAddress)
        console.log(ethers.utils.formatEther(balance)) //makes ether balance readability easier
    }
}

//in frontend js require word cant be used, import word is useful, nodejs later
//add prettier with yarn add --dev prettier ans create a .prettierrc file for ur liking

//fund function
async function fund() {
    //get value of eth to be funded from ip button u created
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount}...`)
    if (typeof window.ethereum !== "undefined") {
        //requirements
        // provider/connection to the blockchain
        // signer/wallet/someone with some gas
        // contract that we are interacting with
        // abi and address
        //for that we would need ethersjs, but cant import so go to ethers js docx, to pull ethers, pull using web browser
        //store frontend version of ethers in another file and import it here
        //react and next js can concert yarn functions in frontend versions, but in basic html js, u gotta do this way
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        //web3provider is like a wrap around for wallets, similar to jsonrpcprovider, its job is to
        //fetch the http end point from wallet to website
        const signer = provider.getSigner()
        //now can get ou connected wallet in signer
        //  console.log(signer)
        //for contract abi and address, use constants file
        //for address, run yarn hardhat node in backend to run contract on a local node and get address where fundme deployed at
        const contract = new ethers.Contract(contractAddress, abi, signer)
        //but this signer is on rinkeby etc and not on hardhat localhost we r using here,
        //so add a new localhost hardhat hetwork on ur metamask, but u wont have any hardhat money on
        //ur current metamask account, so instead import a hardhat account given by local node with its pvt key
        //in ur metamask
        //in case u restart local node, nonce resetted to 0but metamask account is on diff nonce, so
        //it gives error so update it by in metamask as accounts-setting-advanced-reset account
        try {
            //in case transaction rejected or failed, catch error so it doesnt at least break the whole site

            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            })
            //to let funder know that funding happened, listen to the transaction or listen to events
            //to listen for tx mined create another function
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done")
        } catch (error) {
            console.log(error)
        }
    }
}

//listen for tx to be mined, not async function
function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}...`)

    //need to return a promise because provider.once doesnt wait for listener to finish, so the place
    //where listenfortx is called will think the function is completed and move further w/o waiting for listener to finish

    //promise takes 2 parameters, resoleve and reject, here we return resolve after listener finished,
    //u could add a reject at a timecheck eg. it took too long
    //anything of ()=>{} form is an anonymous function
    //awaits promise to return promise resolve or reject before calling this function done and await can move on
    return new Promise((resolve, reject) => {
        //provider.once is an etherjs function which takes 2 param provider.ince(event,listener)
        //it waits here for txhash to finally come, and thenfires listener, who takes txreceipt as ip,
        //which is given in return by tx.hash event, and logs out its confirmation
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(
                `Completed with ${transactionReceipt.confirmations} confirmations`
            )
            resolve()
        })
    })
}

async function withdraw() {
    console.log("Withdrawing...")
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
        } catch (error) {
            console.log(error)
        }
    } else {
        connectButton.innerHTML = "Please install Metamask!"
    }
}
