# 🧠 Memory — Manija (ex Recital Planner)

## Estado Actual
- **Fase:** Producción / Live
- **Última actualización:** 2026-05-26

## URLs
- **Repositorio GitHub:** https://github.com/cinrobles/Recital-planner
- **Sitio publicado (GitHub Pages):** https://cinrobles.github.io/Recital-planner/
- **Supabase Project:** https://yaliibvznvvgmfytnrmy.supabase.co

## Stack
- HTML + CSS + JavaScript (Vanilla)
- Supabase (base de datos)
- GitHub Pages (hosting)

## Base de Datos Supabase
- **Proyecto ID:** yaliibvznvvgmfytnrmy
- **Región:** sa-east-1

### Tablas
| Tabla | Descripción | Filas |
|---|---|---|
| Recitales | Info del evento (artista, fecha, lugar) | activa |
| Planes | Logística del plan (outfit, checklist, horario) | activa |
| Participantes | Personas que se suman al plan compartido | pendiente |

### RLS Policies (creadas 2026-05-25)
- `anon_insert_recitales` / `anon_select_recitales` ✅
- `anon_insert_planes` / `anon_select_planes` ✅
- `anon_insert_participantes` / `anon_select_participantes` ✅

## Analytics — PostHog
- **API Key:** `phc_oLL787wRd9NLRbHiJYuqebziEN6vPw3RE7S7kaitp6pJ`
- **Host:** https://us.i.posthog.com

### Eventos trackeados
| Evento | Propiedades |
|---|---|
| `plan_created` | concert, city, companion, budget |
| `plan_shared_link` | concert, city, plan_id |
| `plan_shared_whatsapp` | concert, city, plan_id |
| `plan_viewed_from_link` | plan_id, concert, city |

## Funcionalidades Implementadas
- [x] Pantalla Home **(Rediseñada con identidad Manija, foto propia y textos finales)**
- [x] Formulario (artista, ciudad, fecha, compañía, presupuesto)
- [x] Pantalla de carga animada
- [x] Resultados (outfit, horario, checklist)
- [x] Pantalla de compartir
- [x] Guardar plan en Supabase (Recitales + Planes)
- [x] Link compartible con `?plan=UUID`
- [x] Cargar plan desde URL compartida
- [x] GitHub Pages publicado
- [x] PostHog analytics integrado
- [x] **Responsividad Mobile nativa (`100dvh`, sin marcos limitantes)**

## Pendiente / Próximos pasos
- [ ] Tabla Participantes: que otros se anoten al plan compartido
- [ ] Descargar imagen para Stories (función pendiente)
- [ ] Notificaciones push antes del recital
