import request from './index.js'

/** 工具列表：category / pricing / platform / q / sort / page / pageSize / featured */
export function getToolsApi (params = {}) {
  return request.get('/tools', { params })
}

/** 工具详情（按 slug） */
export function getToolApi (slug) {
  return request.get(`/tools/${slug}`)
}

/** 分类树 + 全站统计 */
export function getCategoriesApi () {
  return request.get('/categories')
}
