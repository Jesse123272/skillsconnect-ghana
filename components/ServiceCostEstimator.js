'use client';

import React, { useState, useEffect } from 'react';

const CATEGORY_JOBS = {
  'Plumbing': [
    { id: 'leak', name: 'Leak Repair (Tap/Toilet/Pipe)', minPrice: 120, maxPrice: 250, unit: 'per point', duration: '1 - 3 hours', materials: 'Teflon tape, PVC solvent cement, replacement washers/pipe joints.' },
    { id: 'install', name: 'Sink, Basin, or Shower Installation', minPrice: 250, maxPrice: 500, unit: 'per unit', duration: '3 - 6 hours', materials: 'Sillicone sealant, flexible hoses, coupling nuts, anchor bolts.' },
    { id: 'drain', name: 'Drainage/Sewage Clog Clearing', minPrice: 200, maxPrice: 450, unit: 'per line', duration: '2 - 4 hours', materials: 'Drain cleaner compound, plumbing snake hire, protective seals.' },
    { id: 'tank', name: 'Water Tank (Polytank) Installation', minPrice: 600, maxPrice: 1200, unit: 'per tank installation', duration: '1 - 2 days', materials: 'Concrete base bricks, PVC gate valve, union joints, safety float switch.' }
  ],
  'Electrical Work': [
    { id: 'repair', name: 'Socket, Switch, or Breaker Repair', minPrice: 80, maxPrice: 180, unit: 'per point', duration: '1 hour', materials: 'Replacement switch/socket plates, insulated copper wires, electrical tape.' },
    { id: 'appl', name: 'Ceiling Fan or Chandelier Mounting', minPrice: 150, maxPrice: 300, unit: 'per appliance', duration: '1 - 2 hours', materials: 'Expansion bolts, safety hooks, wire connectors, bracket mounts.' },
    { id: 'wire', name: 'Room Rewiring & Circuit Setup', minPrice: 400, maxPrice: 900, unit: 'per room', duration: '1 - 2 days', materials: 'Conduit pipes, 1.5mm/2.5mm copper cable coils, distribution box breakers.' },
    { id: 'solar', name: 'Solar Panel/Inverter System Install', minPrice: 1200, maxPrice: 3000, unit: 'per system', duration: '2 - 4 days', materials: 'Solar mounting rails, MC4 connectors, DC surge protectors, battery racks.' }
  ],
  'Carpentry': [
    { id: 'lock', name: 'Door Hanging & Lock Fitting', minPrice: 100, maxPrice: 250, unit: 'per door', duration: '2 - 4 hours', materials: 'Brass hinges, cylinder mortise lockset, timber wedge, wood screws.' },
    { id: 'cabinet', name: 'Custom Wardrobe or Kitchen Cabinets', minPrice: 1500, maxPrice: 4500, unit: 'per run meter', duration: '5 - 10 days', materials: 'Plywood boards, edge banding, soft-close hinges, drawer runners.' },
    { id: 'roof', name: 'Roof Truss / Carcass Structural Work', minPrice: 2000, maxPrice: 6000, unit: 'per structure', duration: '3 - 7 days', materials: 'Obeche/Odum timber scantlings, wire nails, anti-termite wood treatment.' },
    { id: 'furn', name: 'Furniture Assembly or Restoration', minPrice: 300, maxPrice: 800, unit: 'per item', duration: '4 - 8 hours', materials: 'Wood glue, sanding sheets, clear lacquer spray, dowels.' }
  ],
  'Masonry': [
    { id: 'plaster', name: 'Wall Plastering/Rendering', minPrice: 150, maxPrice: 350, unit: 'per 10 sq meters', duration: '1 - 2 days', materials: 'Ghanacem Portland cement, fine pit sand, plastering trowels.' },
    { id: 'tile', name: 'Floor/Wall Tiling', minPrice: 250, maxPrice: 600, unit: 'per 10 sq meters', duration: '1 - 3 days', materials: 'Porcelain/Ceramic tiles, tile adhesive grout, tile spacers, waterproof backing.' },
    { id: 'foundation', name: 'Brick/Block Foundation Construction', minPrice: 1200, maxPrice: 3500, unit: 'per wall run', duration: '3 - 5 days', materials: '5-inch concrete blocks, iron rod reinforcement (12mm), coarse sand, cement.' },
    { id: 'concrete', name: 'Concrete Casting or Pathway Laying', minPrice: 800, maxPrice: 2200, unit: 'per section', duration: '1 - 2 days', materials: 'Granite stones (chippings), concrete mixer hire, reinforcement mesh.' }
  ],
  'Tailoring': [
    { id: 'alter', name: 'Hemming & General Alterations', minPrice: 40, maxPrice: 100, unit: 'per dress', duration: '1 - 3 hours', materials: 'Matching thread cones, elastic bands, invisible zippers.' },
    { id: 'kente', name: 'Kente Gown/Traditional Kaba Sewing', minPrice: 350, maxPrice: 800, unit: 'per complete outfit', duration: '4 - 7 days', materials: 'Inner lining satin, lace embroidery patches, stay/interfacing, custom hooks.' },
    { id: 'suit', name: 'Corporate Suit Tailoring', minPrice: 500, maxPrice: 1200, unit: 'per suit', duration: '5 - 9 days', materials: 'Suiting fabric wool, shoulder pads, button embellishments, breast canvas.' },
    { id: 'shirt', name: 'Custom Casual Shirt / Trouser', minPrice: 150, maxPrice: 300, unit: 'per item', duration: '2 - 4 days', materials: 'Ghanaian wax print fabric (6 yards), interfacing, plastic collar stays.' }
  ],
  'Hairdressing': [
    { id: 'braid', name: 'Hair Braiding (Kinky/Box Braids/Knotless)', minPrice: 150, maxPrice: 350, unit: 'per style', duration: '3 - 6 hours', materials: 'Synthetic/Human hair attachments, edge control gel, hair oil mist.' },
    { id: 'locks', name: 'Sisterlocks / Dreadlocks Installation', minPrice: 400, maxPrice: 1000, unit: 'per install/interlock', duration: '1 - 2 days', materials: 'Locking comb, organic dreadlock shampoo, essential oil blend.' },
    { id: 'wash', name: 'Washing, Treatment & Blow Dry', minPrice: 80, maxPrice: 180, unit: 'per service', duration: '1 - 2 hours', materials: 'Deep conditioner, leave-in spray, heat protectant serum.' },
    { id: 'bridal', name: 'Complete Bridal Hair Styling Package', minPrice: 600, maxPrice: 1500, unit: 'per bridal design', duration: '2 - 4 hours', materials: 'Bobby pins, hairspray freeze, tiara anchoring pads, hair extension rentals.' }
  ],
  'Painting': [
    { id: 'room', name: 'Single Room Interior Painting', minPrice: 200, maxPrice: 450, unit: 'per room', duration: '1 day', materials: 'Emulsion paint buckets, masking tape, paint roller sets, protective drop sheets.' },
    { id: 'house', name: 'Whole House Exterior & Interior Paint', minPrice: 2500, maxPrice: 7000, unit: 'per building', duration: '4 - 8 days', materials: 'Weather shield paint, wall filler compound, sandpaper rolls, scaffold hire.' },
    { id: 'screed', name: 'Wall Screeding & Base Preparation', minPrice: 300, maxPrice: 800, unit: 'per room', duration: '2 - 3 days', materials: 'Screeding cement putty, sand sealer, smoothing trowels.' },
    { id: 'fence', name: 'Gate, Fence, or Balcony Painting', minPrice: 150, maxPrice: 400, unit: 'per section', duration: '1 - 2 days', materials: 'Anti-rust primer paint, gloss paint, wire brush, oil thinners.' }
  ],
  'Welding': [
    { id: 'gate', name: 'Custom Metal Gate Fabrication', minPrice: 2500, maxPrice: 6500, unit: 'per gate', duration: '5 - 10 days', materials: 'Hollow metal pipes, sheet steel plates, welding electrodes (6013), hinge pins.' },
    { id: 'window', name: 'Burglar Proof Window Grilles', minPrice: 300, maxPrice: 700, unit: 'per window', duration: '2 - 4 days', materials: 'Square iron rods (12mm), flat bar sheets, rust preventative coatings.' },
    { id: 'railing', name: 'Balcony / Staircase Handrail Welding', minPrice: 800, maxPrice: 2000, unit: 'per run meter', duration: '3 - 6 days', materials: 'Stainless steel pipes, cutting discs, grinding discs, Argon gas recharge.' },
    { id: 'repair', name: 'Metal Frame / Machinery Repair Welding', minPrice: 150, maxPrice: 400, unit: 'per job', duration: '2 - 5 hours', materials: 'Metal plates patches, welding fluxes, safety clamps.' }
  ],
  'Mechanics': [
    { id: 'service', name: 'Full Engine Service & Oil Change', minPrice: 150, maxPrice: 350, unit: 'per vehicle service', duration: '1 - 2 hours', materials: 'Engine oil can (5W-30/10W-40), spin-on oil filter, air filter element.' },
    { id: 'brakes', name: 'Brake Pad Replacement & Rotor Skimming', minPrice: 120, maxPrice: 280, unit: 'per axle', duration: '1 - 2 hours', materials: 'Front/rear semi-metallic brake pads, brake fluid dot-4, cleaning spray.' },
    { id: 'ac', name: 'Car AC Recharge & Leak Diagnostics', minPrice: 200, maxPrice: 500, unit: 'per diagnostic/fill', duration: '2 - 4 hours', materials: 'R134a refrigerant gas canister, compressor lubricating oil, seal rings.' },
    { id: 'engine', name: 'Engine Diagnostic & Structural Repairs', minPrice: 1000, maxPrice: 4000, unit: 'per repair job', duration: '2 - 5 days', materials: 'Engine gasket overhaul kit, timing belt/chain, spark plugs, cylinder valves.' }
  ],
  'Fashion Design': [
    { id: 'sketch', name: 'Outfit Concept Design & Sketching', minPrice: 100, maxPrice: 250, unit: 'per style sketch', duration: '1 - 2 days', materials: 'Fashion sketchbook sheets, digital illustration rendering.' },
    { id: 'gown', name: 'Premium Bridal/Evening Gown Styling', minPrice: 800, maxPrice: 2500, unit: 'per gown custom work', duration: '7 - 14 days', materials: 'Satin back crepe, bridal tulle layers, beaded lace appliques, dress corset structure.' },
    { id: 'ready', name: 'Ready-to-Wear Ghanaian Print Apparel', minPrice: 200, maxPrice: 500, unit: 'per piece', duration: '2 - 4 days', materials: 'High quality Woodin/GTP wax fabric, design labels, custom buttons.' },
    { id: 'acc', name: 'Custom Fashion Accessories Fabric Crafting', minPrice: 80, maxPrice: 200, unit: 'per batch', duration: '1 - 2 days', materials: 'Fabric glue, structural foam padding, headband frames, tote canvas.' }
  ]
};

export default function ServiceCostEstimator({ categoryName, artisanName, onApplyEstimate }) {
  // Safe fallback if category name doesn't match perfectly
  const matchingCategory = Object.keys(CATEGORY_JOBS).find(
    cat => cat.toLowerCase() === (categoryName || '').toLowerCase()
  ) || 'Plumbing';

  const jobsList = CATEGORY_JOBS[matchingCategory] || CATEGORY_JOBS['Plumbing'];

  const [selectedJobId, setSelectedJobId] = useState(jobsList[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState('standard'); // 'standard', 'express', 'emergency'

  const activeJob = jobsList.find(job => job.id === selectedJobId) || jobsList[0];

  // Calculate estimates on-the-fly during render (replaces useEffect)
  let multiplier = 1;
  if (urgency === 'express') multiplier = 1.25; // 25% premium
  if (urgency === 'emergency') multiplier = 1.5; // 50% premium

  const minCalc = activeJob ? Math.round(activeJob.minPrice * quantity * multiplier) : 0;
  const maxCalc = activeJob ? Math.round(activeJob.maxPrice * quantity * multiplier) : 0;

  let durationText = activeJob ? activeJob.duration : '';
  if (activeJob && quantity > 1) {
    if (activeJob.duration.includes('hour')) {
      const hours = parseInt(activeJob.duration) * quantity;
      durationText = hours > 8 ? `${Math.round(hours / 8)} - ${Math.round((hours / 8) + 1)} days` : `${hours} hours`;
    } else if (activeJob.duration.includes('day')) {
      const days = parseInt(activeJob.duration) * quantity;
      durationText = `${Math.round(days * 0.8)} - ${days} days`;
    }
  }

  if (urgency === 'express') {
    durationText = `${durationText} (Expedited)`;
  } else if (urgency === 'emergency') {
    durationText = `Urgent (Prioritized ASAP)`;
  }

  const estimate = {
    min: minCalc,
    max: maxCalc,
    duration: durationText,
    materials: activeJob ? activeJob.materials : ''
  };

  const handlePreFill = () => {
    if (!activeJob) return;

    const subjectText = `Service Quote Request: ${activeJob.name}`;
    const messageText = `Hello ${artisanName || 'Artisan'},\n\nI used the instant pricing estimator on your profile to budget for the following job:\n- Service: ${activeJob.name}\n- Work scope/Quantity: ${quantity} ${activeJob.unit}\n- Urgency Level: ${urgency.toUpperCase()}\n- Estimated Budget: GH₵ ${estimate.min} - GH₵ ${estimate.max}\n- Expected Timeline: ${estimate.duration}\n\nCould you please let me know your availability to discuss this work and provide a final firm quote? Thank you.`;

    onApplyEstimate(subjectText, messageText);
  };

  return (
    <div className="card border rounded-4 p-4 bg-white shadow-sm mb-4" id="service-cost-estimator">
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
          <i className="fa-solid fa-calculator text-primary fs-5"></i>
        </div>
        <div>
          <h5 className="fw-bold text-dark mb-0">Ghanaian Trade Price Estimator</h5>
          <small className="text-muted">Instant estimates based on current local rates</small>
        </div>
      </div>

      <div className="row g-3">
        {/* Job Selector */}
        <div className="col-12">
          <label className="form-label text-secondary small fw-medium mb-1">Select Specific Task</label>
          <select 
            className="form-select text-dark font-medium" 
            style={{ fontSize: '14px', borderRadius: '8px' }}
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {jobsList.map(job => (
              <option key={job.id} value={job.id}>{job.name}</option>
            ))}
          </select>
        </div>

        {/* Quantity/Scale Input */}
        <div className="col-sm-6">
          <label className="form-label text-secondary small fw-medium mb-1">
            Quantity / Scope ({activeJob?.unit || 'units'})
          </label>
          <div className="input-group">
            <button 
              className="btn btn-outline-secondary border px-3" 
              type="button"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              -
            </button>
            <input 
              type="number" 
              className="form-control text-center font-semibold text-dark" 
              style={{ fontSize: '14px' }}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
            <button 
              className="btn btn-outline-secondary border px-3" 
              type="button"
              onClick={() => setQuantity(prev => prev + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Urgency Selector */}
        <div className="col-sm-6">
          <label className="form-label text-secondary small fw-medium mb-1">Required Urgency</label>
          <select 
            className="form-select text-dark" 
            style={{ fontSize: '14px', borderRadius: '8px' }}
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
          >
            <option value="standard">Standard Timeline</option>
            <option value="express">Express (+25% Fast Track)</option>
            <option value="emergency">Emergency (+50% Direct Alert)</option>
          </select>
        </div>
      </div>

      {/* ESTIMATE SCREEN */}
      <div className="mt-4 p-3 rounded-3 bg-light border">
        <div className="row align-items-center text-center text-sm-start">
          <div className="col-sm-6 mb-3 mb-sm-0 border-end border-sm-end-0">
            <span className="text-muted fs-8 uppercase tracking-wider d-block mb-1">ESTIMATED PRICE RANGE</span>
            <span className="fs-4 fw-bold text-primary">
              GH₵ {estimate.min} - {estimate.max}
            </span>
            <small className="text-muted d-block mt-1 fs-8">
              Based on {quantity} {activeJob?.unit}
            </small>
          </div>
          <div className="col-sm-6 ps-sm-4 text-start">
            <div className="mb-2">
              <i className="fa-regular fa-clock text-primary me-2"></i>
              <span className="small text-dark fw-medium">Timeline: </span>
              <span className="small text-secondary">{estimate.duration}</span>
            </div>
            <div>
              <i className="fa-solid fa-boxes-stacked text-primary me-2"></i>
              <span className="small text-dark fw-medium">Required Parts: </span>
              <span className="small text-secondary d-block fs-8 leading-tight text-muted mt-0.5">
                {estimate.materials}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        className="btn btn-primary w-100 rounded-pill py-2.5 fw-semibold mt-3 text-white shadow-sm transition-all"
        onClick={handlePreFill}
        style={{ fontSize: '14px' }}
      >
        <i className="fa-solid fa-file-invoice-dollar me-2"></i>
        Apply Quote to Service Enquiry Form
      </button>

      <div className="text-center mt-2">
        <small className="text-muted fs-8">
          *Estmates represent fair baseline labor rates in Ghana and exclude specialized materials.
        </small>
      </div>
    </div>
  );
}
