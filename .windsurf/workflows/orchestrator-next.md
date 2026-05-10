---
description: Orchestrator - sıradaki unblocked todo'yu seç ve uygula
---

## Kullanım: /orchestrator-next

Her Cascade oturumunun başında çalıştır. `brain/orchestrator/mission.json`'u okur, kalan görevi belirler, uygular.

### Adım 1: Mission durumunu oku
// turbo
```bash
cat brain/orchestrator/mission.json | python3 -c "
import json,sys
data=json.load(sys.stdin)
pending=[k for k,v in data['todos'].items() if v['status'] not in ['done','external_user_task']]
print('PENDING:',pending)
ext=[k for k,v in data['todos'].items() if v['status']=='external_user_task']
print('EXTERNAL (user):',ext)
print('Total done:',[k for k,v in data['todos'].items() if v['status']=='done'].__len__())
"
```

### Adım 2: SwarmBus notlarına bak
// turbo
```bash
AGENT_NAME=windsurf python3 agent_tools.py notlar 10
```

### Adım 3: Sıradaki kodu uygula
`partial_missing_script` veya benzer pending status'a sahip todo'yu bul → `brain/orchestrator/stream-briefs.md`'den brief'i oku → uygula.

Şu an pending: **T06** (`scripts/seo-weekly-diff.ts`)

### Adım 4: Tamamlayınca işaretle
Kodu yaz → typecheck/lint → SwarmBus'a bildir:
```bash
AGENT_NAME=windsurf python3 agent_tools.py done "T06 seo-weekly-diff.ts oluşturuldu"
```

`mission.json`'daki `T06.status` → `"done"` olarak güncelle.

### Adım 5: Entegrasyon kapısı (tüm code todos done olunca)
```bash
npm run typecheck && npm run lint && npm run test -- --run && npm run test:e2e:fast
```
