from hashlib import sha256 as sha

tridy = {'pi': 'prima A', 'bi': 'prima B', 'su': 'sekunda', 'te': 'tercie', 'ka': 'kvarta', 'ki': 'kvinta', 'se': 'sexta', 'si': 'septima A', 'zi': 'septima B', 'ko': 'oktáva'}

doc = open("gjsdotazniky.svg").read()

for tr, trida in tridy.items():
  tokens = open(f"tokens-{tr}.csv").read().split()
  tokens[1:1] = ['', '', '', '']
  for strana in range(3):
    kody = tokens[10 * strana:10 * (strana + 1)]
    with open(f"tokeny_{trida}_{strana}.svg", "w+") as f:
      f.write(doc.format(kod=kody, trida=trida, style="display:none" if strana > 0 else ""))
