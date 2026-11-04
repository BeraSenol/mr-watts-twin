import { Droplet, Lightbulb, Smartphone, Users, Zap } from 'lucide-react'
import { StatPill } from '../../components/ui/StatPill'
import { DoorState } from '../../model/types'
import { FloorPlan } from './FloorPlan'

export function Overview() {
  return (
    <div className="overflow-x-clip">
      <FloorPlan door={DoorState.Unlocked} />

      <nav className="fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border-[0.5px] border-white/10 bg-surface/60 p-1.5 shadow-[0_20px_60px_-10px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-2xl backdrop-saturate-150">
          <StatPill icon={Users} tone="bg-accent/15 text-accent" label="People" value="5 of 8" detail="Busiest day: Thursday" />
          <StatPill icon={Lightbulb} tone="bg-glow/15 text-glow" label="Lights on" value="2 of 5" detail="Meeting room off" />
          <StatPill icon={Smartphone} tone="bg-success/15 text-success" label="Devices in" value="7 of 10" detail="3 borrowed" />
          <StatPill icon={Zap} tone="bg-orange/15 text-orange" label="Energy" value="1.4 kW" detail="9.8 kWh today" />
          <StatPill icon={Droplet} tone="bg-cyan/15 text-cyan" label="Bottles saved" value="14" detail="saved today" />
        </div>
      </nav>
    </div>
  )
}
