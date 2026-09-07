import { Calendar, Download, TrendingUp, TrendingDown, Minus, Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react'

export function ModelPerformancePage() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 md:px-6 md:py-8 overflow-y-auto bg-background">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-h1 text-h1 text-on-surface">Model Performance</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-bg text-success font-caption text-caption font-medium border border-success/20">
              <CheckCircle className="w-4 h-4 fill-current text-success-bg stroke-success" />
              Healthy
            </span>
          </div>
          <p className="font-body text-body text-on-surface-variant max-w-2xl">
            The AI risk model is currently accurately predicting claims frequency across all major product lines. Confidence intervals remain within expected tolerances.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="h-[40px] px-4 bg-surface-container-lowest border border-outline-variant text-on-surface font-body text-body rounded-DEFAULT hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="h-[40px] px-4 bg-primary-container text-white font-body text-body rounded-DEFAULT hover:bg-primary hover:text-white transition-colors shadow-sm font-medium">
            Export Report
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Key Metrics Overview (Spans 8 cols) */}
        <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-h3 text-h3 text-on-surface mb-6">Prediction Accuracy Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="border-l-2 border-primary pl-4">
                <p className="font-overline text-overline text-on-surface-variant uppercase tracking-wider mb-1">Global Accuracy</p>
                <p className="font-h1 text-h1 text-on-surface mb-1 tracking-tight">94.2%</p>
                <p className="font-caption text-caption font-medium text-success flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +1.2% vs last month
                </p>
              </div>
              
              <div className="border-l-2 border-outline-variant pl-4">
                <p className="font-overline text-overline text-on-surface-variant uppercase tracking-wider mb-1">False Positives</p>
                <p className="font-h1 text-h1 text-on-surface mb-1 tracking-tight">2.8%</p>
                <p className="font-caption text-caption font-medium text-success flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> -0.4% vs last month
                </p>
              </div>
              
              <div className="border-l-2 border-outline-variant pl-4">
                <p className="font-overline text-overline text-on-surface-variant uppercase tracking-wider mb-1">Model Drift</p>
                <p className="font-h1 text-h1 text-on-surface mb-1 tracking-tight">0.03</p>
                <p className="font-caption text-caption font-medium text-text-secondary flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5" /> Stable
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Recent Alerts (Spans 4 cols) */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xs p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-h3 text-h3 text-on-surface">System Alerts</h3>
            <Bell className="w-5 h-5 text-text-muted" />
          </div>
          <div className="space-y-4 flex-1">
            
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant flex gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-body font-medium text-on-surface">Auto-Retraining Scheduled</p>
                <p className="font-caption text-caption text-on-surface-variant mt-1">Model will undergo standard monthly retraining on Friday at 02:00 UTC.</p>
              </div>
            </div>
            
            <div className="p-3 bg-warning-bg rounded-lg border border-warning/20 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-body text-body font-medium text-warning">Minor Regional Drift detected</p>
                <p className="font-caption text-caption text-warning/80 mt-1">Slight variance in coastal property predictions. Currently under investigation.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Predicted vs Actual Chart Area (Spans full width) */}
        <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xs p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-h3 text-h3 text-on-surface">Risk Tier Validation</h3>
              <p className="font-body text-body text-on-surface-variant mt-1">Comparing predicted claim likelihood against actual claims filed within 12 months.</p>
            </div>
            <div className="flex items-center gap-4 font-caption text-caption font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary-container"></div>
                <span className="text-on-surface-variant">Predicted Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-secondary"></div>
                <span className="text-on-surface-variant">Actual Claims Rate</span>
              </div>
            </div>
          </div>
          
          {/* Simulated Bar Chart */}
          <div className="w-full h-64 flex items-end gap-2 sm:gap-4 md:gap-8 pb-8 border-b border-outline-variant relative">
            
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-on-surface-variant font-mono-data text-caption pr-4 border-r border-outline-variant h-full">
              <span>25%</span>
              <span>20%</span>
              <span>15%</span>
              <span>10%</span>
              <span> 5%</span>
              <span> 0%</span>
            </div>
            
            {/* Chart Bars Container (offset for y-axis) */}
            <div className="w-full h-full flex justify-around items-end pl-12">
              
              {/* Tier 1 */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[60px] group">
                <div className="flex items-end gap-1 w-full h-full justify-center">
                  <div className="w-1/2 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '15%'}}></div>
                  <div className="w-1/2 bg-secondary rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '18%'}}></div>
                </div>
                <span className="font-caption text-caption font-medium text-on-surface-variant">Tier 1</span>
              </div>
              
              {/* Tier 2 */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[60px] group">
                <div className="flex items-end gap-1 w-full h-full justify-center">
                  <div className="w-1/2 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '35%'}}></div>
                  <div className="w-1/2 bg-secondary rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '32%'}}></div>
                </div>
                <span className="font-caption text-caption font-medium text-on-surface-variant">Tier 2</span>
              </div>
              
              {/* Tier 3 */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[60px] group">
                <div className="flex items-end gap-1 w-full h-full justify-center">
                  <div className="w-1/2 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '60%'}}></div>
                  <div className="w-1/2 bg-secondary rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '65%'}}></div>
                </div>
                <span className="font-caption text-caption font-medium text-on-surface-variant">Tier 3</span>
              </div>
              
              {/* Tier 4 */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[60px] group">
                <div className="flex items-end gap-1 w-full h-full justify-center">
                  <div className="w-1/2 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '85%'}}></div>
                  <div className="w-1/2 bg-secondary rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '80%'}}></div>
                </div>
                <span className="font-caption text-caption font-medium text-on-surface-variant">Tier 4</span>
              </div>
              
              {/* Tier 5 */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[60px] group">
                <div className="flex items-end gap-1 w-full h-full justify-center">
                  <div className="w-1/2 bg-primary-container rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '95%'}}></div>
                  <div className="w-1/2 bg-secondary rounded-t-sm transition-all duration-300 group-hover:opacity-80" style={{height: '100%'}}></div>
                </div>
                <span className="font-caption text-caption font-medium text-on-surface-variant">Tier 5</span>
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
