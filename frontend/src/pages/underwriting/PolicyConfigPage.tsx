import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { History, Add, DirectionsCar, ExpandMore, HealthAndSafety, Home as HomeIcon, ChevronRight } from '@mui/icons-material'

export function PolicyConfigPage() {
  const [config, setConfig] = useState<any>(null)
  const [autoExpanded, setAutoExpanded] = useState(true)
  const [healthExpanded, setHealthExpanded] = useState(false)
  const [propertyExpanded, setPropertyExpanded] = useState(false)

  useEffect(() => {
    api.get('/admin/policy-config').then((res: any) => setConfig(res.data)).catch(console.error)
  }, [])

    if (!config) return <div className="p-8 font-body text-body text-text-secondary animate-pulse">Loading...</div>

  return (
    <div className="flex-1 overflow-y-auto bg-surface h-full">
      <div className="max-w-max-width mx-auto px-gutter py-8 md:py-margin w-full">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-2">Policy Configuration</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Define underwriting rules and premium bands for your products.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="h-10 px-4 bg-surface text-on-surface border border-outline-variant rounded hover:bg-surface-container-low transition-colors font-caption text-caption flex items-center gap-2">
              <History className="text-sm" />
              Audit Log
            </button>
            <button className="h-10 px-4 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-caption text-caption font-medium shadow-sm flex items-center gap-2">
              <Add className="text-sm" />
              New Product
            </button>
          </div>
        </header>

        {/* Configuration Content */}
        <div className="space-y-6">
          
          {/* Auto Policy Card */}
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xs overflow-hidden transition-all duration-200">
            {/* Accordion Header */}
            <button 
              className="w-full text-left px-6 py-5 flex items-center justify-between bg-surface hover:bg-surface-container-low transition-colors border-b border-outline-variant focus:outline-none" 
              onClick={() => setAutoExpanded(!autoExpanded)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <DirectionsCar className="text-primary-container" />
                </div>
                <div>
                  <h3 className="font-h3 text-h3 text-on-surface">Auto</h3>
                  <p className="font-caption text-caption text-text-secondary mt-0.5">Comprehensive & Collision • Active</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="font-caption text-caption text-on-surface-variant">Last updated by Sarah K.</span>
                  <span className="font-overline text-overline text-text-muted mt-0.5">Oct 24, 2023 • v1.4</span>
                </div>
                <ExpandMore className={`text-outline-variant transform transition-transform duration-200 ${autoExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Accordion Content */}
            <div className={`px-6 py-6 space-y-8 bg-surface ${autoExpanded ? 'block' : 'hidden'}`}>
              
              {/* Underwriting Rules */}
              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Coverage Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Minimum Driver Age</label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 py-2 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all" type="number" defaultValue="18"/>
                    </div>
                  </div>
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Max Vehicle Age (Years)</label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 py-2 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all" type="number" defaultValue="25"/>
                    </div>
                  </div>
                </div>
              </section>

              {/* Premium Bands */}
              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Premium Bands</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="bg-bg-muted p-4 rounded-lg border border-outline-variant/50">
                    <span className="font-overline text-overline text-text-secondary block mb-3 uppercase tracking-wide">Base Tier</span>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Min Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="450.00"/>
                        </div>
                      </div>
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Max Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="1200.00"/>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-muted p-4 rounded-lg border border-outline-variant/50">
                    <span className="font-overline text-overline text-text-secondary block mb-3 uppercase tracking-wide">Standard Tier</span>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Min Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="800.00"/>
                        </div>
                      </div>
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Max Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="2500.00"/>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-muted p-4 rounded-lg border border-outline-variant/50">
                    <span className="font-overline text-overline text-text-secondary block mb-3 uppercase tracking-wide">Premium Tier</span>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Min Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="1800.00"/>
                        </div>
                      </div>
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Max Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="5000.00"/>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* Approval Thresholds */}
              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Approval Thresholds</h4>
                <div className="bg-surface-container-low rounded-lg p-5 border border-outline-variant">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-caption text-caption text-on-surface font-medium block">Straight-Through Processing (STP) Limit</span>
                      <span className="font-overline text-overline text-text-secondary block mt-1">Policies below this limit are auto-approved if rules pass.</span>
                    </div>
                    <div className="w-48 relative">
                      <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                      <input 
                        className="w-full h-11 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" 
                        type="text" 
                        value={config.auto_approval_limit || '3000.00'} 
                        onChange={(e: any) => setConfig({...config, auto_approval_limit: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline-variant/50 pt-4">
                    <div>
                      <span className="font-caption text-caption text-on-surface font-medium block">Manual Review Escalation</span>
                      <span className="font-overline text-overline text-text-secondary block mt-1">Flag for Senior Underwriter if premium exceeds.</span>
                    </div>
                    <div className="w-48 relative">
                      <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                      <input className="w-full h-11 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="7500.00"/>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-6">
                <button className="h-10 px-4 bg-surface text-on-surface border border-outline-variant rounded hover:bg-surface-container-low transition-colors font-caption text-caption">Cancel</button>
                <button className="h-10 px-4 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-caption text-caption font-medium shadow-sm">Save Changes</button>
              </div>

            </div>
          </div>

          {/* Health Policy Card */}
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xs overflow-hidden transition-all duration-200">
            <button 
              className="w-full text-left px-6 py-5 flex items-center justify-between bg-surface hover:bg-surface-container-low transition-colors border-b border-outline-variant focus:outline-none"
              onClick={() => setHealthExpanded(!healthExpanded)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center">
                  <HealthAndSafety className="text-success" />
                </div>
                <div>
                  <h3 className="font-h3 text-h3 text-on-surface">Health</h3>
                  <p className="font-caption text-caption text-text-secondary mt-0.5">Individual & Family • Active</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="font-caption text-caption text-on-surface-variant">Last updated by James M.</span>
                  <span className="font-overline text-overline text-text-muted mt-0.5">Sep 12, 2023 • v2.1</span>
                </div>
                <ExpandMore className={`text-outline-variant transform transition-transform duration-200 ${healthExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Accordion Content */}
            <div className={`px-6 py-6 space-y-8 bg-surface ${healthExpanded ? 'block' : 'hidden'}`}>
              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Coverage Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Minimum Age</label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 py-2 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all" type="number" defaultValue="0"/>
                    </div>
                  </div>
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Max Age (Years)</label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 py-2 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all" type="number" defaultValue="100"/>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Premium Bands</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-bg-muted p-4 rounded-lg border border-outline-variant/50">
                    <span className="font-overline text-overline text-text-secondary block mb-3 uppercase tracking-wide">Base Tier</span>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Min Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="250.00"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-6">
                <button className="h-10 px-4 bg-surface text-on-surface border border-outline-variant rounded hover:bg-surface-container-low transition-colors font-caption text-caption">Cancel</button>
                <button className="h-10 px-4 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-caption text-caption font-medium shadow-sm">Save Changes</button>
              </div>
            </div>
          </div>

          {/* Property Policy Card */}
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xs overflow-hidden transition-all duration-200">
            <button 
              className="w-full text-left px-6 py-5 flex items-center justify-between bg-surface hover:bg-surface-container-low transition-colors border-b border-outline-variant focus:outline-none"
              onClick={() => setPropertyExpanded(!propertyExpanded)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warning-bg flex items-center justify-center">
                  <HomeIcon className="text-warning" />
                </div>
                <div>
                  <h3 className="font-h3 text-h3 text-on-surface">Property</h3>
                  <p className="font-caption text-caption text-text-secondary mt-0.5">Homeowners & Renters • Active</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="font-caption text-caption text-on-surface-variant">Last updated by System</span>
                  <span className="font-overline text-overline text-text-muted mt-0.5">Aug 01, 2023 • v1.0</span>
                </div>
                <ExpandMore className={`text-outline-variant transform transition-transform duration-200 ${propertyExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Accordion Content */}
            <div className={`px-6 py-6 space-y-8 bg-surface ${propertyExpanded ? 'block' : 'hidden'}`}>
              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Coverage Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Minimum Property Value</label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 py-2 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all" type="number" defaultValue="50000"/>
                    </div>
                  </div>
                  <div>
                    <label className="block font-caption text-caption text-on-surface mb-2 font-medium">Max Property Age (Years)</label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 py-2 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20 transition-all" type="number" defaultValue="150"/>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="font-h3 text-h3 text-on-surface border-b border-outline-variant pb-2 mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Premium Bands</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-bg-muted p-4 rounded-lg border border-outline-variant/50">
                    <span className="font-overline text-overline text-text-secondary block mb-3 uppercase tracking-wide">Base Tier</span>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-caption text-caption text-on-surface-variant mb-1">Min Premium</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-text-muted font-mono-data">$</span>
                          <input className="w-full h-10 pl-7 pr-3 bg-surface border border-outline-variant rounded font-mono-data text-mono-data text-right text-on-surface focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/20" type="text" defaultValue="600.00"/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-6">
                <button className="h-10 px-4 bg-surface text-on-surface border border-outline-variant rounded hover:bg-surface-container-low transition-colors font-caption text-caption">Cancel</button>
                <button className="h-10 px-4 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-caption text-caption font-medium shadow-sm">Save Changes</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
