# DAO Hardhat project

Simple app to voting

```shell

dmozze@dmozze-pc:~/Study/BlockChain/richOrDieTrying$ npx hardhat test


  base DAO
    ✔ deploy (1408ms)
    ✔ decimals (100ms)
    ✔ create proposal + check ById search (112ms)
    ✔ create proposal + check ByHash search (118ms)
    ✔ check capacity of queue (201ms)

  Base voting
    ✔ Base Voting YES (243ms)
    ✔ Base Voting NO (214ms)
    ✔ Base Voting YES + NO (153ms)
    ✔ two accounts voting YES (141ms)
    ✔ accept proposal (149ms)
    ✔ reject proposal (141ms)
    ✔ cancel proposal (134ms)
    ✔ check reverting of voting (144ms)

  Transfer check
    ✔ base Transfer (63ms)
    ✔ Transfer with voting (119ms)
    ✔ Transfer with voting recipient side (156ms)
    ✔ Transfer with voting both sides (183ms)

  task from the statement
    ✔ main task with 25 / 40 / 35 (131ms)
    ✔ invert main task with 25 / 40 / 35 (133ms)


  19 passing (4s)


```
