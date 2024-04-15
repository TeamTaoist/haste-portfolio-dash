export enum EventType {
  // dashboard
  dashboard_page_show_tabs = "dashboard_page_show_tabs",
  dashboard_page_hide_tabs = "dashborad_page_hide_tabs",

  dashboard_assets_show = "dashboard_assets_show",
  dashboard_assets_hide = "dashboard_assets_hide",

  dashboard_tokens_reload = "dashboard_tokens_reload",

  dashboard_checkRgb_reload = "dashboard_checkRgb_reload",

  // transaction
  transaction_reload_page = "transaction_reload_page",
  transaction_item_show = "transaction_item_show",
  transaction_item_hide = "transaction_item_hide",
  transaction_item_load_more = "transaction_item_load_more",

  // transfer
  transfer_reload_page = "transfer_reload_page",

  // team switcher
  team_switcher_reload = "team_switcher_reload",

  // main nav reload
  main_nav_reload = "main_nav_reload",
}
