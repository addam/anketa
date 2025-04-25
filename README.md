# Jak připravit anketu pro nový rok

* spustím `node import.js -g`, což přepíše soubor `uvazky.csv`
* ručně projdu `uvazky.csv` a namísto skupin napíšu `,1` u volitelných předmětů
    * jinde promažu duplicity
* ručně promažu/upravím `otazky.csv`
* ujistím se, že soubor `anketa.db` mám někde zálohovaný, a pak ho smažu
* spustím `node import.js`, což znovu vytvoří soubor `anketa.db`
* 