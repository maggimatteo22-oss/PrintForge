// =============================================================
// PRINTFORGE WIZARD GUIDATO IN 3 STEP
// Percorso semplificato e intuitivo per clienti novizi
// =============================================================

let currentWizardStep = 1;
let selectedWizardModel = {
  name: 'Vaso Voronoi Decorativo',
  presetId: 'vase',
  icon: '🏺',
  baseGrams: 90
};
let selectedWizardMaterial = {
  id: 'PLA',
  name: 'PLA Standard',
  desc: 'Ideale per prototipi, statuette e decorazioni da interno. Il più economico ed ecologico.',
  pricePerGram: 0.15,
  color: 'Arancione Neon'
};

function setAppMode(mode) {
  const wizardContainer = document.getElementById('guidedWizardSection');
  const proStudioSection = document.getElementById('sezione-studio') || document.getElementById('sezione-generatore-ai');
  const btnWizardMode = document.getElementById('btnModeWizard');
  const btnProMode = document.getElementById('btnModePro');

  if (mode === 'wizard') {
    if (wizardContainer) wizardContainer.classList.remove('hidden');
    if (proStudioSection) proStudioSection.classList.add('hidden');
    if (btnWizardMode) {
      btnWizardMode.className = "px-4 py-2 rounded-xl bg-[#ff5500] text-black font-extrabold text-xs shadow-lg orange-glow flex items-center gap-2 transition";
    }
    if (btnProMode) {
      btnProMode.className = "px-4 py-2 rounded-xl bg-[#1a1a1a] text-neutral-400 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-2 transition";
    }
    // Scroll al wizard
    wizardContainer?.scrollIntoView({ behavior: 'smooth' });
  } else {
    if (wizardContainer) wizardContainer.classList.add('hidden');
    if (proStudioSection) proStudioSection.classList.remove('hidden');
    if (btnWizardMode) {
      btnWizardMode.className = "px-4 py-2 rounded-xl bg-[#1a1a1a] text-neutral-400 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-2 transition";
    }
    if (btnProMode) {
      btnProMode.className = "px-4 py-2 rounded-xl bg-[#ff5500] text-black font-extrabold text-xs shadow-lg orange-glow flex items-center gap-2 transition";
    }
    proStudioSection?.scrollIntoView({ behavior: 'smooth' });
  }
}

function selectWizardStep(stepNum) {
  currentWizardStep = stepNum;
  for (let i = 1; i <= 3; i++) {
    const pane = document.getElementById(`wizardStepContent${i}`);
    const tab = document.getElementById(`wizardTab${i}`);
    if (pane) {
      if (i === stepNum) {
        pane.classList.remove('hidden');
        pane.classList.add('block');
      } else {
        pane.classList.add('hidden');
        pane.classList.remove('block');
      }
    }
    if (tab) {
      if (i === stepNum) {
        tab.className = "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff5500] text-black font-black text-xs orange-glow transition cursor-pointer";
      } else if (i < stepNum) {
        tab.className = "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition cursor-pointer";
      } else {
        tab.className = "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#151515] text-neutral-400 border border-white/5 font-bold text-xs transition cursor-pointer";
      }
    }
  }
  updateWizardSummary();
}

function selectWizardModelPreset(name, presetId, icon, grams) {
  selectedWizardModel = { name, presetId, icon, baseGrams: grams };
  
  // Seleziona visivamente la card
  document.querySelectorAll('.wizard-model-card').forEach(c => {
    c.classList.remove('border-[#ff5500]', 'bg-[#ff5500]/10');
    c.classList.add('border-white/10', 'bg-[#151515]');
  });
  const el = document.getElementById(`wizardModel_${presetId}`);
  if (el) {
    el.classList.add('border-[#ff5500]', 'bg-[#ff5500]/10');
    el.classList.remove('border-white/10', 'bg-[#151515]');
  }

  // Se la funzione 3D esiste, carica anche il preset nel visualizzatore
  if (typeof loadPresetModel === 'function') {
    try {
      loadPresetModel(presetId);
    } catch (e) {
      console.warn("loadPresetModel call in wizard warning:", e);
    }
  }

  updateWizardSummary();
}

function selectWizardMaterialOption(id, name, desc, pricePerGram) {
  selectedWizardMaterial = {
    id,
    name,
    desc,
    pricePerGram,
    color: selectedWizardMaterial.color || 'Nero Opaco'
  };

  document.querySelectorAll('.wizard-material-card').forEach(c => {
    c.classList.remove('border-[#ff5500]', 'bg-[#ff5500]/10');
    c.classList.add('border-white/10', 'bg-[#151515]');
  });
  const el = document.getElementById(`wizardMat_${id}`);
  if (el) {
    el.classList.add('border-[#ff5500]', 'bg-[#ff5500]/10');
    el.classList.remove('border-white/10', 'bg-[#151515]');
  }

  updateWizardSummary();
}

function updateWizardSummary() {
  const modelTxt = document.getElementById('wizardSummaryModel');
  const matTxt = document.getElementById('wizardSummaryMat');
  const priceTxt = document.getElementById('wizardSummaryPrice');
  const timeTxt = document.getElementById('wizardSummaryTime');

  const basePrice = Math.max(12.50, selectedWizardModel.baseGrams * selectedWizardMaterial.pricePerGram + 6.00);
  const printHours = Math.max(1.5, (selectedWizardModel.baseGrams / 25)).toFixed(1);

  if (modelTxt) modelTxt.innerText = `${selectedWizardModel.icon} ${selectedWizardModel.name}`;
  if (matTxt) matTxt.innerText = `${selectedWizardMaterial.name} (${selectedWizardMaterial.id})`;
  if (priceTxt) priceTxt.innerText = `€${basePrice.toFixed(2)}`;
  if (timeTxt) timeTxt.innerText = `~${printHours} ore`;
}

function finishWizardAndAddToCart() {
  const basePrice = Math.max(12.50, selectedWizardModel.baseGrams * selectedWizardMaterial.pricePerGram + 6.00);
  const makerObj = (typeof MAKERS_LIST !== 'undefined' && MAKERS_LIST.length > 0) 
    ? MAKERS_LIST[0] 
    : { name: 'Maker Certificato PrintForge', id: 'maker_top' };

  const cartItem = {
    id: 'cart-wiz-' + Date.now(),
    productId: selectedWizardModel.presetId,
    title: selectedWizardModel.name,
    seller: makerObj.name,
    sellerId: makerObj.id,
    price: parseFloat(basePrice.toFixed(2)),
    qty: 1,
    material: `${selectedWizardMaterial.name} (${selectedWizardMaterial.id})`,
    icon: selectedWizardModel.icon
  };

  if (typeof shoppingCart !== 'undefined') {
    shoppingCart.push(cartItem);
    if (typeof StorageManager !== 'undefined') {
      StorageManager.saveCart(shoppingCart);
    }
    if (typeof renderCartUI === 'function') renderCartUI();
    if (typeof showCartToast === 'function') {
      showCartToast(`${selectedWizardModel.name} configurato con successo!`, basePrice);
    }
    if (typeof openCartDrawer === 'function') {
      openCartDrawer();
    }
  } else {
    alert(`Aggiunto al carrello: ${selectedWizardModel.name} a €${basePrice.toFixed(2)}!`);
  }
}
