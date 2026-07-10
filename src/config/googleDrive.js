/**
 * Google Drive API Client-Side Direct Integration (Zero-GAS)
 */

export async function createDriveFolder(accessToken, folderName) {
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    throw new Error("Gagal membuat folder di Google Drive Anda.");
  }

  const folder = await response.json();

  // Set permission folder agar file di dalamnya bisa dibaca publik secara cepat
  await fetch(`https://www.googleapis.com/drive/v3/files/${folder.id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone",
    }),
  });

  return folder.id;
}

export async function uploadFileToDrive(accessToken, folderId, fileBlob, fileName) {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  formData.append("file", fileBlob);

  // PERBAIKAN 1: Tambahkan &fields=id,webViewLink,webContentLink agar API membalas dengan URL lengkap
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Catatan: Jangan tambahkan Content-Type di sini, biarkan browser yang mengurus format multipart-nya
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Detail Error Drive:", errorData);
    throw new Error("Gagal mengunggah foto ke Google Drive.");
  }

  const fileData = await response.json();
  
  // PERBAIKAN 2: Gunakan endpoint 'uc?export=view' agar foto bisa langsung ditampilkan di UI web
  return {
    fileId: fileData.id,
    webViewLink: `https://drive.google.com/uc?export=view&id=${fileData.id}`
  };
}