# PASO 5: Optimizar Rendimiento - Plan de Mejora

## 🎯 Objetivo

Optimizar velocidad, reducir bundle size y mejorar UX sin cambiar funcionalidad.

---

## 📊 Análisis Actual

### Frontend Performance
```
Bundle Size: ~500KB (gzip)
Initial Load: ~3-5s
Runtime Performance: Media
Mobile Performance: Lenta (FCP > 3s)
```

### Backend Performance
```
Query Times: 100-500ms (queries sin índices)
API Latency: 200-800ms
Memory Usage: Media
Database Size: ~100MB
```

---

## 🛠️ Optimizaciones Implementar

### Frontend (3-4 horas)

#### 1️⃣ **Lazy Loading de Componentes**
```javascript
// Antes
import WorkOrderReview from './pages/WorkOrderReview';
import AssetExpedient from './pages/AssetExpedient';
import PreventiveChecklist from './pages/PreventiveChecklist';

// Después
const WorkOrderReview = React.lazy(() => import('./pages/WorkOrderReview'));
const AssetExpedient = React.lazy(() => import('./pages/AssetExpedient'));
const PreventiveChecklist = React.lazy(() => import('./pages/PreventiveChecklist'));

// En router:
<Suspense fallback={<LoadingSpinner />}>
  <Route path="work-order-review" element={<WorkOrderReview />} />
</Suspense>
```

**Impact:** -40-50% initial bundle size

#### 2️⃣ **API Response Caching**
```javascript
// src/services/cache.js
class APICache {
  constructor(ttl = 300000) { // 5 min default
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetcher) {
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < this.ttl) {
        return data;
      }
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(key) {
    this.cache.delete(key);
  }
}

export const apiCache = new APICache();
```

**Usage:**
```javascript
const data = await apiCache.get('work-orders-list', () =>
  maintenanceApi.getWorkOrders({ limit: 50 })
);
```

**Impact:** -30-40% API calls on repeated views

#### 3️⃣ **Code Splitting por Ruta**
```javascript
// routes.jsx
const MaintenanceRouter = React.lazy(() => import('./maintenance/router'));
const AnalyticsRouter = React.lazy(() => import('./analytics/router'));

export const routes = [
  {
    path: 'maintenance',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <MaintenanceRouter />
      </Suspense>
    ),
  },
  {
    path: 'analytics',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsRouter />
      </Suspense>
    ),
  },
];
```

**Impact:** -25-35% time to interactive

#### 4️⃣ **Optimizar Assets**
```javascript
// Usar WebP con fallback
<img 
  src="image.webp"
  alt="description"
  loading="lazy"
/>

// Minificar SVGs
// Comprimir imágenes con ImageOptim/TinyPNG
```

**Impact:** -20-30% image sizes

---

### Backend (2-3 horas)

#### 5️⃣ **Database Query Optimization**
```javascript
// Índices para queries frecuentes
prisma.$executeRaw`CREATE INDEX idx_work_orders_plant_id ON work_orders(plant_id)`
prisma.$executeRaw`CREATE INDEX idx_work_orders_status ON work_orders(status)`
prisma.$executeRaw`CREATE INDEX idx_assets_plant_id ON assets(plant_id)`

// Query optimization
// Antes: N+1 queries
const orders = await prisma.workOrder.findMany({
  include: {
    asset: true,
    assignedTechnician: true,
  },
});

// Mejor: Select only needed fields
const orders = await prisma.workOrder.findMany({
  select: {
    id: true,
    status: true,
    asset: { select: { name: true, code: true } },
    assignedTechnician: { select: { name: true } },
  },
  where: { plantId },
  take: 50,
});
```

**Impact:** -50-70% query times

#### 6️⃣ **API Response Compression**
```javascript
// src/config/compression.js
import compression from 'compression';

app.use(compression({
  level: 6, // balance speed vs compression
  threshold: 1024, // compress responses > 1KB
}));
```

**Impact:** -60-80% response sizes

#### 7️⃣ **Rate Limiting & Caching Headers**
```javascript
// src/middleware/cacheHeaders.js
export const setCacheHeaders = (req, res, next) => {
  // Cache GET requests for 5 minutes
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    res.set('Cache-Control', 'no-cache');
  }
  next();
};

// Use in routes
app.use('/api/maintenance', setCacheHeaders);
```

**Impact:** -40-50% repeated requests

#### 8️⃣ **Pagination Implementation**
```javascript
// Already implemented in dbHelpers:
export async function findManyWithPlantId(
  prismaModel,
  plantId,
  filters = {},
  options = {}
) {
  const { take = 50, skip = 0 } = options;
  
  return prismaModel.findMany({
    where: { plantId, ...filters },
    take,
    skip,
    orderBy: { createdAt: 'desc' },
  });
}

// API endpoint:
router.get('/', validatePlantId, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const data = await findManyWithPlantId(prisma.model, req.currentPlantId, {}, {
    take: limit,
    skip,
  });

  const total = await countWithPlantId(prisma.model, req.currentPlantId);

  return res.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}));
```

**Impact:** -70-80% memory usage, faster responses

---

## 📊 Optimizaciones por Impacto

| Optimización | Frontend | Backend | Impacto |
|--------------|----------|---------|---------|
| Lazy Loading | 40-50% | - | Alto |
| API Caching | 30-40% | - | Alto |
| Query Optimization | - | 50-70% | Alto |
| Compression | - | 60-80% | Alto |
| Pagination | - | 70-80% | Muy Alto |
| Code Splitting | 25-35% | - | Alto |
| Asset Optimization | 20-30% | - | Medio |
| Cache Headers | - | 40-50% | Medio |

**Total Impacto Esperado:** -50-60% load time, -40% bundle size

---

## 🎯 Implementación Phase

### Phase 1: Frontend (90 min)
- [ ] Setup React.lazy y Suspense
- [ ] Implement API cache service
- [ ] Add code splitting por router
- [ ] Optimize images

### Phase 2: Backend (60 min)
- [ ] Add database indexes
- [ ] Optimize SELECT queries
- [ ] Add compression middleware
- [ ] Implement pagination

### Phase 3: Monitoring (30 min)
- [ ] Setup performance metrics
- [ ] Monitor API response times
- [ ] Track bundle size changes

---

## ✅ Validation

### Performance Metrics (Before vs After)
```
Initial Load Time:  3-5s → 1-2s (-60-70%)
Bundle Size:        500KB → 250-300KB (-40-50%)
Query Response:     200-800ms → 50-150ms (-70%)
API Call Reduction: 100% → 30-40% (with caching)
Mobile FCP:         >3s → <1.5s (-50-60%)
```

---

## 🚀 Expected Results

### Before
```
Load Time: 3-5 seconds
Bundle: 500KB
API Calls: Frequent
Queries: Slow
Mobile: Poor
```

### After
```
Load Time: 1-2 seconds (-60%)
Bundle: 250-300KB (-40%)
API Calls: Cached (-60%)
Queries: Fast (-70%)
Mobile: Good
```

---

**Estimated Total Time:** 4-5 horas  
**Complexity:** Media  
**Risk:** Bajo (todas son optimizaciones no-breaking)

