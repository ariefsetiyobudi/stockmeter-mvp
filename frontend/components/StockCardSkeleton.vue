<template>
  <div class="stock-card-skeleton">
    <SkeletonLoader type="title" />
    <SkeletonLoader type="text" width="40%" />
    <div class="skeleton-divider"></div>
    <div class="skeleton-row">
      <SkeletonLoader type="text" width="30%" />
      <SkeletonLoader type="text" width="25%" />
    </div>
    <div class="skeleton-row">
      <SkeletonLoader type="text" width="35%" />
      <SkeletonLoader type="text" width="30%" />
    </div>
    <div class="skeleton-row">
      <SkeletonLoader type="text" width="28%" />
      <SkeletonLoader type="text" width="32%" />
    </div>
  </div>
</template>

<style scoped>
.stock-card-skeleton {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.skeleton-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 1rem 0;
}

.skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
</style>
