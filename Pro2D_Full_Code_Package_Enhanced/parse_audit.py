import json

text = """
const skey = selectedReducerType === 'eccentric' ? 'REBW' : 'RCON';
   addInlineItem({
     // …
     reducerType: selectedReducerType,
     metadata: { skey },
   });
"""

import sys
print(text)
