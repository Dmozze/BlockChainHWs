import threading
import time
import json
from datetime import datetime
from web3 import Web3

alchemy_url = "PRIVATE_DATA"
w3 = Web3(Web3.HTTPProvider(alchemy_url))
print(w3.isConnected())


def print_log(contract, description, decimals):
    price = str(contract.functions.latestAnswer().call())
    while len(price) <= decimals:
        price = "0" + price
    inv_decimals = len(price) - decimals
    price = price[:inv_decimals] + "." + price[inv_decimals:]
    print(description + " is " + price + " on " + datetime.now().strftime("%d/%m/%Y %H:%M:%S"))


def log_loop(contractAddress):
    poll_interval = 10
    f = open('abi.json')
    abi = json.load(f)
    contract = w3.eth.contract(contractAddress, abi=abi)
    event_filter = contract.events.AnswerUpdated.createFilter(fromBlock='latest')
    decimals = contract.functions.decimals().call()
    description = contract.functions.description().call()
    print("Thread of " + description + " started at " + datetime.now().strftime("%d/%m/%Y %H:%M:%S"))
    print_log(contract, description, decimals)
    while True:
        if len(event_filter.get_new_entries()):
            print_log(contract, description, decimals)
        time.sleep(poll_interval)


threading.Thread(target=log_loop, args=("0x7De0d6fce0C128395C488cb4Df667cdbfb35d7DE",)).start()
threading.Thread(target=log_loop, args=("0x37bC7498f4FF12C19678ee8fE19d713b87F6a9e6",)).start()
threading.Thread(target=log_loop, args=("0xbba12740DE905707251525477bAD74985DeC46D2",)).start()
