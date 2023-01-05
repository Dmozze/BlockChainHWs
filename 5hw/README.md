# DAO Hardhat project

Simple app to voting

```shell

dmozze@dmozze-pc:~/Study/BlockChain/richOrDieTrying$ npx hardhat test
Compiled 1 Solidity file successfully


  base DAO
    ✔ deploy (1142ms)
    ✔ decimals (84ms)
    ✔ create proposal + check ById search (95ms)
    ✔ create proposal + check ByHash search (93ms)
    ✔ check capacity of queue (182ms)

  Base voting
    ✔ Base Voting YES (107ms)
    ✔ Base Voting NO (107ms)
    ✔ Base Voting YES + NO (142ms)
    ✔ two accounts voting YES (136ms)
    ✔ accept proposal (151ms)
    ✔ reject proposal (144ms)
    ✔ cancel proposal (119ms)
    ✔ check reverting of voting (137ms)

  Transfer check
    ✔ base Transfer (67ms)
    ✔ Transfer with voting (116ms)
    ✔ Transfer with voting recipient side (150ms)
    ✔ Transfer with voting both sides (178ms)

  task from the statement
    ✔ main task with 25 / 40 / 35 (131ms)
    ✔ invert main task with 25 / 40 / 35 (133ms)
    ✔ accepted with one more vote (137ms)
    ✔ 1 vote to accepted (201ms)


  21 passing (4s)




```
