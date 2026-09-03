namespace GameVault.Api.Contracts;

public class DashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalGames { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<SalesPoint> RecentSales { get; set; } = new();
    public List<PopularGame> PopularGames { get; set; } = new();
    public List<RecentOrder> RecentOrders { get; set; } = new();
}

public class SalesPoint
{
    public string Label { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class PopularGame
{
    public string Title { get; set; } = string.Empty;
    public int Sales { get; set; }
}

public class RecentOrder
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
